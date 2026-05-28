// Edge Function : post-to-fna (cahier §7 #3)
// Déverse les écritures de paie d'une campagne dans Atlas FNA via API directe.
// Sécurité : le secret ATLAS_FNA_API_KEY ne quitte jamais le serveur (§2.5).
// Idempotence : un run ne peut être posté deux fois (table fna_postings).
//
// Déploiement : supabase functions deploy post-to-fna
// Secrets requis : ATLAS_FNA_API_URL, ATLAS_FNA_API_KEY

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface AccountingRow {
  account: string;
  label: string;
  debit: number;
  credit: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function postWithRetry(url: string, init: RequestInit, attempts = 3): Promise<Response> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, init);
      if (res.ok || (res.status >= 400 && res.status < 500)) return res; // pas de retry sur 4xx
      lastError = new Error(`FNA HTTP ${res.status}`);
    } catch (e) {
      lastError = e;
    }
    await new Promise((r) => setTimeout(r, 300 * 2 ** i)); // backoff exponentiel
  }
  throw lastError;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const { runId } = await req.json();
    if (!runId) return json({ status: 'error', message: 'runId manquant' }, 400);

    // Client scoped sur le JWT appelant → RLS appliquée (isolation tenant).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } },
    );

    // 1) Déjà déversé ? (idempotence — protection anti-doublon comptable)
    const { data: existing } = await supabase
      .from('fna_postings')
      .select('id')
      .eq('run_id', runId)
      .maybeSingle();
    if (existing) return json({ status: 'duplicate', reference: existing.id });

    // 2) Lire les écritures (déterministes, déjà persistées par AccountingMapper)
    const { data: rows, error: readErr } = await supabase
      .from('accounting_entries')
      .select('account, label, debit, credit')
      .eq('run_id', runId);
    if (readErr) return json({ status: 'error', message: readErr.message }, 400);
    if (!rows?.length) return json({ status: 'error', message: 'Aucune écriture pour ce run' }, 404);

    const { data: run } = await supabase
      .from('payroll_runs')
      .select('tenant_id, period, country_code')
      .eq('id', runId)
      .single();

    const totalDebit = (rows as AccountingRow[]).reduce((s, r) => s + Number(r.debit), 0);
    const totalCredit = (rows as AccountingRow[]).reduce((s, r) => s + Number(r.credit), 0);
    if (totalDebit !== totalCredit) {
      return json({ status: 'error', message: 'Écritures déséquilibrées — déversement refusé' }, 422);
    }

    // 3) POST vers l'API Atlas FNA (secret côté serveur) + clé d'idempotence
    const fnaRes = await postWithRetry(Deno.env.get('ATLAS_FNA_API_URL')!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('ATLAS_FNA_API_KEY')!}`,
        'Idempotency-Key': `${run?.tenant_id}:${runId}`,
      },
      body: JSON.stringify({
        source: 'atlas-people',
        runId,
        period: run?.period,
        countryCode: run?.country_code,
        entries: rows,
        totals: { debit: totalDebit, credit: totalCredit },
      }),
    });

    if (!fnaRes.ok) {
      return json({ status: 'error', message: `Atlas FNA a refusé (HTTP ${fnaRes.status})` }, 502);
    }
    const fnaBody = await fnaRes.json().catch(() => ({}));

    // 4) Marquer le run déversé (RPC idempotent : raise si déjà posté)
    const { error: postErr } = await supabase.rpc('post_run_to_fna', { p_run_id: runId });
    if (postErr) return json({ status: 'duplicate', message: postErr.message });

    return json({ status: 'posted', reference: fnaBody.reference ?? runId });
  } catch (e) {
    return json({ status: 'error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
