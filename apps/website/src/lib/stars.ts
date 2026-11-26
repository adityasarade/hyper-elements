import { site } from "./site";
import { starLabel } from "./star-label";

/**
 * The repo's GitHub star count, as the header shows it ("1.2k"), read once per build: the module is
 * evaluated once, so every page shares this one request. Offline, there's none, and the GitHub link shows
 * without a number. The page brings it up to date in the browser (Header.astro): the site is built only when
 * main changes, so the build's count goes stale.
 */
export const stars: Promise<string | null> = (async () => {
  try {
    const res = await fetch(`https://api.github.com/repos/${site.repo}`, {
      signal: AbortSignal.timeout(3000),
      headers: { accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    const n = (await res.json()).stargazers_count as number;
    return starLabel(n);
  } catch {
    return null;
  }
})();
