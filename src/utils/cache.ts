export function setCache(key: string, value: any, ttlMs: number) {
  const item = {
    value,
    expiry: Date.now() + ttlMs,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

// Obtiene un valor de localStorage si no ha expirado
export function getCache<T>(key: string): T | null {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    if (Date.now() > item.expiry) {
      localStorage.removeItem(key); //  Expiró → lo borramos
      return null;
    }
    return item.value as T;
  } catch {
    return null;
  }
}
