import axios, { type AxiosRequestConfig } from 'axios';

const baseURL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api';

export const http = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export type Params = Record<string, string | number | boolean | undefined | null>;

function cleanParams(params?: Params): Params | undefined {
  if (!params) return undefined;
  const out: Params = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  }
  return out;
}

/** Accepts either a bare payload or an envelope such as { data: ... }. */
export function unwrap<T>(body: unknown): T {
  if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in (body as object)) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/** Validates that the payload is a list (bare, or inside data/rows/items). */
export function asArray<T>(body: unknown, label = 'response'): T[] {
  const v = unwrap<unknown>(body);
  if (Array.isArray(v)) return v as T[];
  if (v && typeof v === 'object') {
    const o = v as Record<string, unknown>;
    for (const key of ['rows', 'items', 'results']) {
      if (Array.isArray(o[key])) return o[key] as T[];
    }
  }
  throw new Error(`The server returned an unexpected ${label} format (a list was expected).`);
}

export function asObject<T extends object>(body: unknown, label = 'response'): T {
  const v = unwrap<unknown>(body);
  if (v && typeof v === 'object' && !Array.isArray(v)) return v as T;
  throw new Error(`The server returned an unexpected ${label} format (an object was expected).`);
}

export interface ApiErrorInfo {
  message: string;
  conflicts: string[];
  status?: number;
}

export function isCancelled(e: unknown): boolean {
  return axios.isCancel(e);
}

/** Extracts the meaningful message (and any conflict list) returned by the backend. */
export function describeError(e: unknown): ApiErrorInfo {
  if (axios.isAxiosError(e)) {
    if (!e.response) {
      return {
        message: 'Cannot reach the server. Check that the backend is running and VITE_API_BASE_URL is correct.',
        conflicts: [],
      };
    }
    const data = e.response.data as unknown;
    let message = '';
    let conflicts: string[] = [];
    if (typeof data === 'string' && data.length < 400) message = data;
    else if (data && typeof data === 'object') {
      const o = data as Record<string, unknown>;
      message = String(o.message ?? o.error ?? o.sqlMessage ?? '');
      const c = o.conflicts ?? o.errors;
      if (Array.isArray(c)) {
        conflicts = c.map((x) => (typeof x === 'string' ? x : String((x as Record<string, unknown>).message ?? JSON.stringify(x))));
      }
    }
    return { message: message || `Request failed (HTTP ${e.response.status}).`, conflicts, status: e.response.status };
  }
  return { message: e instanceof Error ? e.message : 'Something went wrong.', conflicts: [] };
}

export function getErrorMessage(e: unknown): string {
  return describeError(e).message;
}

async function request(config: AxiosRequestConfig): Promise<unknown> {
  const res = await http.request(config);
  return res.data;
}

export const api = {
  get: (url: string, params?: Params, signal?: AbortSignal) =>
    request({ url, method: 'GET', params: cleanParams(params), signal }),
  post: (url: string, data?: unknown) => request({ url, method: 'POST', data }),
  put: (url: string, data?: unknown) => request({ url, method: 'PUT', data }),
  patch: (url: string, data?: unknown) => request({ url, method: 'PATCH', data }),
  delete: (url: string) => request({ url, method: 'DELETE' }),
};

export interface Crud<T> {
  list: (params?: Params, signal?: AbortSignal) => Promise<T[]>;
  get: (id: number | string, signal?: AbortSignal) => Promise<T>;
  create: (body: Partial<T>) => Promise<unknown>;
  update: (id: number | string, body: Partial<T>) => Promise<unknown>;
  remove: (id: number | string) => Promise<void>;
}

export function createCrud<T extends object>(path: string, label: string): Crud<T> {
  return {
    list: async (params, signal) => asArray<T>(await api.get(path, params, signal), label),
    get: async (id, signal) => asObject<T>(await api.get(`${path}/${id}`, undefined, signal), label),
    create: async (body) => unwrap(await api.post(path, body)),
    update: async (id, body) => unwrap(await api.put(`${path}/${id}`, body)),
    remove: async (id) => {
      await api.delete(`${path}/${id}`);
    },
  };
}
