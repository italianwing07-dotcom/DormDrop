// Screenshot harness: renders DormLoot screens against the mock Supabase.
// Usage: node capture.cjs <outDir> [widthSet]
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const OUT = process.argv[2] || "/tmp/shots";
const ONLY = process.argv[3] || "";
const BASE = "http://localhost:3000";
const MOCK = "http://localhost:54321";

const USERS = {
  seller: { id: "11111111-1111-4111-8111-111111111111", email: "mariana.okonkwo@fordham.edu" },
  buyer: { id: "22222222-2222-4222-8222-222222222222", email: "devin.ramaswamy@fordham.edu" }
};
const LISTING = "a0000000-0000-4000-8000-000000000001";
const THREAD = "c0000000-0000-4000-8000-000000000001";

const VIEWPORTS = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 }
];

function sessionFor(user) {
  return {
    access_token: "mock-access-token-" + user.id,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "mock-refresh-" + user.id,
    user: {
      id: user.id, aud: "authenticated", role: "authenticated", email: user.email,
      email_confirmed_at: new Date(Date.now() - 9e8).toISOString(),
      app_metadata: { provider: "email", providers: ["email"] }, user_metadata: {},
      identities: [], created_at: new Date(Date.now() - 9e8).toISOString(),
      updated_at: new Date().toISOString()
    }
  };
}

const SCREENS = [
  { name: "01-home", url: "/", user: null },
  { name: "02-browse", url: "/browse", user: null },
  { name: "03-listing", url: `/listings/${LISTING}`, user: null },
  { name: "04-listing-auth", url: `/listings/${LISTING}`, user: "buyer" },
  { name: "05-login", url: "/login", user: null },
  { name: "06-forgot", url: "/forgot-password", user: null },
  { name: "07-reset-invalid", url: "/reset-password", user: null },
  { name: "08-create", url: "/create", user: "seller" },
  { name: "09-create-guest", url: "/create", user: null },
  { name: "10-profile", url: "/profile", user: "seller" },
  { name: "11-inbox", url: "/inbox", user: "seller" },
  { name: "12-thread", url: `/inbox/${THREAD}`, user: "seller" },
  { name: "13-edit", url: `/listings/${LISTING}/edit`, user: "seller" },
  { name: "14-admin", url: "/admin/reports", user: "seller" },
  { name: "15-browse-empty", url: "/browse?q=zzzznothingmatches", user: null },
  { name: "16-404", url: "/listings/a0000000-0000-4000-8000-00000000dead", user: null }
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
  const issues = [];

  for (const vp of VIEWPORTS) {
    if (ONLY && ONLY !== vp.name) continue;
    for (const screen of SCREENS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2
      });
      if (screen.user) {
        const s = sessionFor(USERS[screen.user]);
        await context.addInitScript(
          ([key, value]) => { try { window.localStorage.setItem(key, value); } catch {} },
          ["sb-localhost-auth-token", JSON.stringify(s)]
        );
      }
      await fetch(`${MOCK}/__reset`, { method: "POST" }).catch(() => {});
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
      page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200)); });
      try {
        await page.goto(BASE + screen.url, { waitUntil: "networkidle", timeout: 25000 });
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(OUT, `${screen.name}-${vp.name}.png`), fullPage: true });
      } catch (e) {
        errors.push("navigation: " + e.message);
        try { await page.screenshot({ path: path.join(OUT, `${screen.name}-${vp.name}-FAILED.png`) }); } catch {}
      }
      const realErrors = errors.filter((e) =>
        !e.includes("favicon") && !e.includes("realtime") && !e.includes("WebSocket") &&
        !e.includes("Failed to load resource: the server responded with a status of 404") );
      if (realErrors.length) issues.push(`${screen.name}@${vp.name}: ${realErrors.slice(0, 3).join(" | ")}`);
      await context.close();
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "_issues.txt"), issues.join("\n") || "no console/page errors");
  console.log(issues.length ? "ISSUES:\n" + issues.join("\n") : "no console/page errors detected");
})();
