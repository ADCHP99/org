// utils/cache.ts

export function setCache<T>(key: string, data: T, ttlMinutes: number) {
  const now = new Date().getTime();
  const item = {
    data,
    expiry: now + ttlMinutes * 60 * 1000,
  };
  localStorage.setItem(key, JSON.stringify(item));
}

export function getCache<T>(key: string): T | null {
  const itemStr = localStorage.getItem(key);
  if (!itemStr) return null;

  try {
    const item = JSON.parse(itemStr);
    const now = new Date().getTime();

    if (now > item.expiry) {
      localStorage.removeItem(key);
      return null;
    }

    return item.data as T;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}
