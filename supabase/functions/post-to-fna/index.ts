// Edge Function : post-to-fna (cahier §7 #3)
// Déverse les écritures de paie d'une campagne dans Atlas FNA via API directe.
// Sécurité : le secret ATLAS_FNA_API_KEY ne quitte jamais le serveur (§2.5).
//
// Idempotence TRIPLE :
//   1. en-tête HTTP `Idempotency-Key` = tenant:cycle côté Atlas FNA ;
//   2. index unique (cycle_id) sur payroll_accounting_entries — une seule OD
//      par cycle, donc rien à déverser deux fois ;
//   3. RPC atlas_people.post_cycle_to_fna qui refuse une OD déjà exportée.
//
// ⚠️ La campagne est un CYCLE (payroll_cycles), pas un `run`. La version
// précédente lisait `accounting_entries` par `run_id` : table sans producteur,
// clé pointant vers payroll_runs (chaîne morte constatée en 0055). Le
// commentaire « déjà persistées par AccountingMapper » était faux —
// AccountingMapper n'écrit rien en base. Voir l'arbitrage complet en tête de
// la migration 0057. Les écritures sont désormais produites par la RPC
// atlas_people.generate_cycle_accounting_entry(cycle_id).
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
    const body = await req.json();
    const cycleId = body?.cycleId;
    if (!cycleId) {
      // Refus explicite plutôt que silencieux : un appelant resté sur runId
      // doit savoir que la clé de campagne a changé.
      if (body?.runId) {
        return json({
          status: 'error',
          message:
            'runId n\'est plus la clé de campagne comptable — passer cycleId '
            + '(payroll_cycles). Voir migration 0057.',
        }, 400);
      }
      return json({ status: 'error', message: 'cycleId manquant' }, 400);
    }

    // Client scoped sur le JWT appelant → RLS appliquée (isolation tenant).
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      {
        db: { schema: 'atlas_people' },
        global: { headers: { Authorization: req.headers.get('Authorization')! } },
      },
    );

    // 1) OD du cycle — produite en amont par generate_cycle_accounting_entry.
    const { data: entry, error: entryErr } = await supabase
      .from('payroll_accounting_entries')
      .select('id, tenant_id, cycle_id, journal, status, balanced, total_debit, total_credit')
      .eq('cycle_id', cycleId)
      .maybeSingle();
    if (entryErr) return json({ status: 'error', message: entryErr.message }, 400);
    if (!entry) {
      return json({
        status: 'error',
        message: 'Aucune OD pour ce cycle — appeler generate_cycle_accounting_entry d\'abord',
      }, 404);
    }

    // 2) Déjà déversée ? (idempotence — protection anti-doublon comptable)
    if (entry.status === 'exported') {
      return json({ status: 'duplicate', reference: entry.id });
    }

    const { data: rows, error: readErr } = await supabase
      .from('payroll_accounting_entry_lines')
      .select('account, label, debit, credit')
      .eq('entry_id', entry.id);
    if (readErr) return json({ status: 'error', message: readErr.message }, 400);
    if (!rows?.length) return json({ status: 'error', message: 'OD sans ligne — rien à déverser' }, 404);

    const { data: cycle } = await supabase
      .from('payroll_cycles')
      .select('period, country_code')
      .eq('id', cycleId)
      .single();

    // 3) Contrôle d'équilibre — recalculé ici, jamais présumé depuis l'en-tête.
    const totalDebit = (rows as AccountingRow[]).reduce((s, r) => s + Number(r.debit), 0);
    const totalCredit = (rows as AccountingRow[]).reduce((s, r) => s + Number(r.credit), 0);
    if (totalDebit !== totalCredit) {
      return json({ status: 'error', message: 'Écritures déséquilibrées — déversement refusé' }, 422);
    }

    // 4) POST vers l'API Atlas FNA (secret côté serveur) + clé d'idempotence
    const fnaRes = await postWithRetry(Deno.env.get('ATLAS_FNA_API_URL')!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('ATLAS_FNA_API_KEY')!}`,
        'Idempotency-Key': `${entry.tenant_id}:${cycleId}`,
      },
      body: JSON.stringify({
        source: 'atlas-people',
        cycleId,
        journal: entry.journal,
        period: cycle?.period,
        countryCode: cycle?.country_code,
        entries: rows,
        totals: { debit: totalDebit, credit: totalCredit },
      }),
    });

    if (!fnaRes.ok) {
      return json({ status: 'error', message: `Atlas FNA a refusé (HTTP ${fnaRes.status})` }, 502);
    }
    const fnaBody = await fnaRes.json().catch(() => ({}));

    // 5) Marquer l'OD déversée (RPC idempotent : raise si déjà exportée)
    const { error: postErr } = await supabase.rpc('post_cycle_to_fna', {
      p_cycle_id: cycleId,
      p_reference: 'atlas-fna',
    });
    if (postErr) return json({ status: 'duplicate', message: postErr.message });

    return json({ status: 'posted', reference: fnaBody.reference ?? entry.id });
  } catch (e) {
    return json({ status: 'error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
