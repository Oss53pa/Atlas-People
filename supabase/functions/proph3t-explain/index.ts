// Edge Function : proph3t-explain (cahier §2.3, §5.1)
// Passerelle LLM SOUVERAINE de Proph3t.
//   • Ollama EXCLUSIF (auto-hébergé) dès qu'il y a de la donnée nominale —
//     JAMAIS d'API cloud/free-tier. Aucune solution de repli externe.
//   • Le LLM N'EXPLIQUE QUE : il ne calcule JAMAIS un montant ni un verdict
//     juridique. Toute requête de calcul est refusée et renvoyée au moteur
//     déterministe (compute-payslip / ComplianceGuard).
//   • Pédagogie en français ; trace d'accès aux données.
//
// Déploiement : supabase functions deploy proph3t-explain
// Secrets requis : OLLAMA_URL (endpoint interne), OLLAMA_MODEL (def. llama3.1)
import { CORS, json } from '../_shared/cors.ts';
import { resolveCaller, serviceClient } from '../_shared/supabase.ts';
import { chainHash, GENESIS_HASH } from '../_shared/audit.ts';

// Intentions de CALCUL → refus (le déterministe s'en charge).
const CALC_PATTERNS = [
  /\bcalcule[rz]?\b/i, /\bcombien\b.*\b(exact|précis|net|brut|impôt|iuts|cotisation)/i,
  /\bmontant\b.*\b(exact|précis|net|brut)/i, /\bnet à payer\b/i, /\bétablis?\b.*\bbulletin/i,
  /\bquel.*\b(salaire|net|brut|impôt|prélèvement)\b.*\?$/i,
];
// Intentions de VERDICT juridique → refus (ComplianceGuard tranche).
const LEGAL_PATTERNS = [
  /\b(est-?ce|c'est)\b.*\b(légal|illégal|conforme|autorisé)\b/i,
  /\bai-?je le droit\b/i, /\bpuis-?je licencier\b/i,
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const caller = await resolveCaller(req);
    if (!caller) return json({ status: 'error', message: 'Non authentifié' }, 401);

    const { question, context } = await req.json() as { question?: string; context?: string };
    if (!question || question.trim().length < 3) {
      return json({ status: 'error', message: 'Question vide' }, 400);
    }

    // Garde-fou 1 : refuser tout calcul monétaire.
    if (CALC_PATTERNS.some((re) => re.test(question))) {
      return json({
        status: 'refused', reason: 'calculation',
        message: 'Proph3t n\'effectue aucun calcul de paie. Les montants sont produits par le moteur déterministe (bulletins officiels signés). Je peux en revanche vous EXPLIQUER comment une rubrique est calculée.',
      });
    }
    // Garde-fou 2 : refuser tout verdict juridique.
    if (LEGAL_PATTERNS.some((re) => re.test(question))) {
      return json({
        status: 'refused', reason: 'legal_verdict',
        message: 'Proph3t ne rend pas de verdict juridique. La conformité est tranchée par le moteur de règles (ComplianceGuard) et validée par les RH. Je peux vous expliquer le principe applicable.',
      });
    }

    // Garde-fou 3 : Ollama EXCLUSIF — aucune solution de repli cloud.
    const ollamaUrl = Deno.env.get('OLLAMA_URL');
    if (!ollamaUrl) {
      return json({
        status: 'error', reason: 'sovereign_llm_unavailable',
        message: 'Le LLM souverain (Ollama) est indisponible. Aucun repli vers un service cloud n\'est autorisé sur des données nominales.',
      }, 503);
    }
    const model = Deno.env.get('OLLAMA_MODEL') ?? 'llama3.1';

    const system = [
      'Tu es Proph3t, copilote RH d\'Atlas People pour l\'Afrique francophone (UEMOA/CEMAC).',
      'Règles inviolables :',
      '- Tu EXPLIQUES uniquement (pédagogie). Tu ne calcules JAMAIS un montant, un net, un impôt ni une cotisation.',
      '- Tu ne rends JAMAIS de verdict juridique : tu décris le principe, jamais une décision.',
      '- Si on te demande un calcul ou une décision, tu renvoies vers le moteur déterministe / les RH.',
      '- Réponds en français, de façon concise et claire. Données souveraines : ne divulgue aucune donnée hors contexte fourni.',
    ].join('\n');

    const prompt = context ? `Contexte (interne, ne pas divulguer hors sujet) :\n${context}\n\nQuestion : ${question}` : question;

    // Appel Ollama auto-hébergé (chat). Aucune clé d'API externe.
    const res = await fetch(`${ollamaUrl.replace(/\/$/, '')}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      }),
    });
    if (!res.ok) {
      return json({ status: 'error', message: `Ollama a répondu HTTP ${res.status}` }, 502);
    }
    const data = await res.json().catch(() => ({}));
    const answer = data?.message?.content ?? data?.response ?? '';

    // Trace d'accès chaînée (Proph3t a consulté des données nominales pour répondre).
    try {
      const svc = serviceClient();
      const { data: last } = await svc
        .from('audit_log').select('hash').eq('tenant_id', caller.tenantId)
        .order('id', { ascending: false }).limit(1).maybeSingle();
      const prevHash = last?.hash ?? GENESIS_HASH;
      const payload = {
        action: 'proph3t.explain', actorId: caller.userId,
        model, hasContext: Boolean(context),
      };
      const hash = await chainHash(prevHash, payload);
      await svc.from('audit_log').insert({
        tenant_id: caller.tenantId, actor_id: caller.userId, action: 'proph3t.explain',
        entity: 'llm_query', entity_id: caller.employeeId ?? caller.userId,
        payload, prev_hash: prevHash, hash,
      });
    } catch (_) { /* la trace ne doit pas bloquer la réponse */ }

    return json({ status: 'ok', engine: 'ollama', model, answer });
  } catch (e) {
    return json({ status: 'error', message: e instanceof Error ? e.message : String(e) }, 500);
  }
});
