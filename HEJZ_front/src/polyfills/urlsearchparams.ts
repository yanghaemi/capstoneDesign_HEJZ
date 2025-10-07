// src/polyfills/urlsearchparams.ts
// RN 최소 기능: set/append/get/delete/toString

type InitType =
  | string
  | Record<string, string | number | boolean | null | undefined>
  | [string, string][];

class SimpleURLSearchParams {
  private map = new Map<string, string[]>();

  constructor(init?: InitType) {
    if (!init) return;
    if (typeof init === 'string') {
      const q = init.startsWith('?') ? init.slice(1) : init;
      if (q) {
        for (const pair of q.split('&')) {
          if (!pair) continue;
          const [k = '', v = ''] = pair.split('=');
          this.append(decodeURIComponent(k), decodeURIComponent(v));
        }
      }
    } else if (Array.isArray(init)) {
      for (const [k, v] of init) this.append(k, v);
    } else {
      for (const k of Object.keys(init)) {
        const v = (init as any)[k];
        if (v !== undefined && v !== null) this.set(k, String(v));
      }
    }
  }

  append(key: string, value: string) {
    const arr = this.map.get(key) || [];
    arr.push(value);
    this.map.set(key, arr);
  }
  set(key: string, value: string) {
    this.map.set(key, [value]);
  }
  get(key: string): string | null {
    const arr = this.map.get(key);
    return arr && arr.length ? arr[0] : null;
  }
  delete(key: string) {
    this.map.delete(key);
  }
  toString() {
    const parts: string[] = [];
    for (const [k, arr] of this.map.entries()) {
      for (const v of arr) {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`);
      }
    }
    return parts.join('&');
  }
}

// 전역 주입 (기존이 있어도 set이 없으면 교체)
const g: any = (globalThis as any);
const Existing = g.URLSearchParams;

if (!Existing || typeof Existing.prototype?.set !== 'function') {
  g.URLSearchParams = SimpleURLSearchParams;
}

export {};
