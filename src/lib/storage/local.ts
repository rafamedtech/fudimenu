type LocalSchema = {
  'fudi:locale': 'es' | 'en';
  'fudi:theme': 'light' | 'dark';
  'fudi:branchId': string;
  'fudi:onboardingStep': number;
};

class TypedStorage<T extends Record<string, unknown>> {
  get<K extends keyof T>(key: K): T[K] | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(String(key));
      return raw ? (JSON.parse(raw) as T[K]) : null;
    } catch {
      return null;
    }
  }
  set<K extends keyof T>(key: K, value: T[K]): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(String(key), JSON.stringify(value));
    } catch {
      // ignore quota errors
    }
  }
  remove<K extends keyof T>(key: K): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(String(key));
  }
}

export const localStore = new TypedStorage<LocalSchema>();
