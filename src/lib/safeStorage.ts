/**
 * safeLocalStorage — wrapper localStorage qui ne crash jamais (privé/quota/SSR).
 */
export const safeLocalStorage = {
  get(key: string): string | null {
    try { return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null; }
    catch { return null; }
  },
  set(key: string, value: string): void {
    try { if (typeof window !== 'undefined') window.localStorage.setItem(key, value); } catch { /* noop */ }
  },
  remove(key: string): void {
    try { if (typeof window !== 'undefined') window.localStorage.removeItem(key); } catch { /* noop */ }
  },
  getJSON<T>(key: string, fallback: T): T {
    const raw = this.get(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  },
  setJSON(key: string, value: unknown): void {
    try { this.set(key, JSON.stringify(value)); } catch { /* noop */ }
  },
};
