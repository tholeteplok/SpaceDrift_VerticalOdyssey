/**
 * Space Drift - LocalStorage Abstraction Layer
 */

const memFallback = new Map();

export const store = {
  get(k, d = null) {
    try {
      const v = localStorage.getItem(k);
      return v === null ? d : v;
    } catch (e) {
      return memFallback.has(k) ? memFallback.get(k) : d;
    }
  },
  set(k, v) {
    try {
      localStorage.setItem(k, v);
    } catch (e) {
      memFallback.set(k, v);
    }
  },
  del(k) {
    try {
      localStorage.removeItem(k);
    } catch (e) {
      memFallback.delete(k);
    }
  }
};
