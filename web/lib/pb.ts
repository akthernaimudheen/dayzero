// PocketBase API client for DayZero web server routes.
//
// This module is intended for use in Next.js server contexts (Route Handlers,
// server components, and server utilities) where localStorage is unavailable.
// It returns a tiny client with a single fetch method that attaches the
// auth token and forwards JSON responses.

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'http://127.0.0.1:8090';

export interface PbClient {
  fetch(path: string, init?: RequestInit): Promise<PBResponse>;
}

export interface PBResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

function headersFor(options?: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (options?.body && typeof options.body !== 'string') {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

export async function pbClient(token?: string): Promise<PbClient> {
  return {
    async fetch(path, options = {}) {
      const headers = headersFor(options);
      if (token) {
        headers['Authorization'] = token;
      }

      // Await the network call before exposing ok/status/json: reading them off
      // the in-flight Response promise yields undefined and breaks every caller.
      const res = await fetch(`${PB_URL}${path}`, {
        ...options,
        headers,
      });

      return {
        ok: res.ok,
        status: res.status,
        async json() {
          const data = await res.json().catch(() => ({}));
          return data as unknown;
        },
      } as PBResponse;
    },
  };
}

export { PB_URL }; // PbClient is exported inline by its interface declaration
