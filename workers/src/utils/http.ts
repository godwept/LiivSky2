import type { Env, ErrorEnvelope } from '../types';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
};

export function jsonResponse(data: unknown, init: ResponseInit = {}, env?: Env): Response {
  const headers = new Headers({ ...JSON_HEADERS, ...(init.headers ?? {}) });
  applyCors(headers, env);
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: string,
  env?: Env,
): Response {
  const payload: ErrorEnvelope = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return jsonResponse(payload, { status }, env);
}

export function preflightResponse(env?: Env): Response {
  const headers = new Headers();
  applyCors(headers, env);
  headers.set('access-control-allow-methods', 'GET, OPTIONS');
  headers.set('access-control-allow-headers', 'content-type');
  headers.set('access-control-max-age', '86400');
  return new Response(null, { status: 204, headers });
}

export function withCache(response: Response, maxAgeSeconds: number): Response {
  const clonedHeaders = new Headers(response.headers);
  clonedHeaders.set('cache-control', `public, max-age=${maxAgeSeconds}`);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: clonedHeaders,
  });
}

function applyCors(headers: Headers, env?: Env): void {
  headers.set('access-control-allow-origin', env?.CORS_ORIGIN ?? '*');
  headers.set('vary', 'origin');
}
