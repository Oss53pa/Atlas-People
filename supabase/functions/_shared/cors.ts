// Origines autorisées (requêtes navigateur → edge functions Atlas People)
const ALLOWED_ORIGINS = [
  'https://atlas-people.atlas-studio.org',
  'https://atlas-people.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

const PROD_ORIGIN = 'https://atlas-people.atlas-studio.org';

// Constante backward-compatible pour les fonctions JWT-protégées (verify_jwt: true)
export const CORS = {
  'Access-Control-Allow-Origin': PROD_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// CORS dynamique — utiliser pour les fonctions sans JWT (verify_jwt: false)
export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get('origin') ?? '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : PROD_ORIGIN;
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

export function jsonWithCors(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  });
}
