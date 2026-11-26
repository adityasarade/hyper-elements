/** A star count as the header shows it: "540", "1.2k", "12k". Shared by the build (stars.ts) and the browser. */
export const starLabel = (n: number): string => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));
