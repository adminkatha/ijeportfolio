// Shared helpers for the QA scripts: flags, a `next start` server, and the local Chrome.
import { spawn } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright";

export const args = process.argv.slice(2);
export const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
};

/** Starts `next start` on --port (default 3100) unless --url is given, and resolves once it answers. */
export async function startServer() {
  const url = flag("url", null);
  const port = Number(flag("port", "3100"));
  const baseUrl = url ?? `http://localhost:${port}`;
  let child = null;
  if (!url) {
    const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
    child = spawn(process.execPath, [nextBin, "start", "-p", String(port)], { stdio: "ignore" });
  }
  const start = Date.now();
  for (;;) {
    try {
      if ((await fetch(baseUrl)).status < 500) break;
    } catch {
      // not up yet
    }
    if (Date.now() - start > 60_000) throw new Error(`Server at ${baseUrl} did not respond within 60s`);
    await new Promise((r) => setTimeout(r, 300));
  }
  return { baseUrl, stop: () => child?.kill() };
}

export async function launchBrowser() {
  try {
    return await chromium.launch({ channel: "chrome" });
  } catch {
    return await chromium.launch();
  }
}

/** Git Bash (MSYS) rewrites "/work" into "C:/Program Files/Git/work"; undo that. */
export const unmangleRoute = (r) => r.replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/]|$)/, "").replace(/\\/g, "/") || "/";

export const routesFlag = (fallback = "/") =>
  flag("routes", fallback)
    .split(",")
    .map((r) => unmangleRoute(r.trim()))
    .filter(Boolean);

export const MOBILE = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
export const DESKTOP = { viewport: { width: 1440, height: 900 } };
