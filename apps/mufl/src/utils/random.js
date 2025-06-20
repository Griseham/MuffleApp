// utils/random.js
export const seeded = (seed) => {
    let s = seed;
    return () => (s = Math.imul(48271, s) % 0x7fffffff) / 0x7fffffff;
  };
  