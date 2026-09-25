const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test, beforeEach, afterEach } = require("node:test");
const ts = require("typescript");
const { JSDOM } = require("jsdom");

// Component tests with isolated, fake auth responses. No emails are sent and no
// real account/session/password is used or changed by this test suite.
const dom = new JSDOM("<!doctype html><div id='root'></div>", {
  url: "https://dormloot.example/reset-password"
});
global.window = dom.window;
global.document = dom.window.document;
global.FormData = dom.window.FormData;
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");

let root;
let handlers;
let calls;
let auth;
let router;

function loadModule(relativePath, overrides = {}) {
  const filename = path.resolve(__dirname, "..", relativePath);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const module = { exports: {} };
  const mocks = {
    "@/lib/supabase/browser-client": { getBrowserSupabaseClient: () => ({ auth }) },
    "next/link": { __esModule: true, default: (props) => React.createElement("a", props) },
    "next/navigation": { useRouter: () => router },
    ...overrides
  };
  vm.runInNewContext(compiled, {
    exports: module.exports, module,
    require: (name) => mocks[name] ?? require(name),
    window, FormData, Error, console
  }, { filename });
  return module.exports;
}

async function mount(relativePath, exportName) {
  const helpers = loadModule("lib/supabase/auth.ts");
  const Component = loadModule(relativePath, { "@/lib/supabase/auth": helpers })[exportName];
  await act(async () => root.render(React.createElement(Component)));
}

function fill(name, value) {
  document.querySelector(`[name="${name}"]`).value = value;
}

async function submit() {
  await act(async () => {
    document.querySelector("form").dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
  });
}

beforeEach(() => {
  window.history.replaceState({}, "", "/reset-password");
  handlers = new Set();
  calls = [];
  router = { replace: (url) => calls.push(["replace", url]), push() {}, refresh() {} };
  auth = {
    initialize: async () => ({ error: null }),
    getUser: async () => ({ data: { user: { id: "fake-user" } }, error: null }),
    resetPasswordForEmail: async (...args) => { calls.push(["recover", ...args]); return { error: null }; },
    updateUser: async (...args) => { calls.push(["update", ...args]); return { error: null }; },
    onAuthStateChange: (callback) => {
      handlers.add(callback);
      return { data: { subscription: { unsubscribe: () => handlers.delete(callback) } } };
    }
  };
  root = createRoot(document.getElementById("root"));
});

afterEach(async () => {
  await act(async () => root.unmount());
  assert.equal(handlers.size, 0, "auth subscriptions must be cleaned up");
});

test("login provides the forgot-password link, signup does not", async () => {
  await mount("components/auth-form.tsx", "AuthForm");
  assert.equal(document.querySelector('a[href="/forgot-password"]').textContent, "Forgot your password?");
  await act(async () => [...document.querySelectorAll("button")].find((b) => b.textContent === "Create account").click());
  assert.equal(document.querySelector('a[href="/forgot-password"]'), null);
});

test("reset requests normalize the email and use the current site's password page", async () => {
  await mount("components/forgot-password-form.tsx", "ForgotPasswordForm");
  fill("email", "Student@Fordham.edu");
  await submit();
  assert.equal(calls[0][0], "recover");
  assert.equal(calls[0][1], "student@fordham.edu");
  assert.equal(calls[0][2].redirectTo, "https://dormloot.example/reset-password");
  assert.match(document.querySelector('[role="status"]').textContent, /If an account exists/);
});

test("unknown accounts receive the same neutral confirmation", async () => {
  auth.resetPasswordForEmail = async () => ({ error: { code: "user_not_found" } });
  await mount("components/forgot-password-form.tsx", "ForgotPasswordForm");
  fill("email", "unknown@example.edu");
  await submit();
  assert.match(document.querySelector('[role="status"]').textContent, /If an account exists/);
});

test("email rate limits show a retryable error and re-enable submission", async () => {
  auth.resetPasswordForEmail = async () => ({ error: new Error("email rate limit exceeded") });
  await mount("components/forgot-password-form.tsx", "ForgotPasswordForm");
  fill("email", "student@example.edu");
  await submit();
  assert.match(document.querySelector('[role="alert"]').textContent, /wait a few minutes/);
  assert.equal(document.querySelector('button[type="submit"]').disabled, false);
  assert.equal(document.querySelector('[role="status"]'), null);
});

test("email request cannot be submitted twice while waiting", async () => {
  let finish;
  auth.resetPasswordForEmail = async () => { calls.push(["recover"]); return new Promise((resolve) => { finish = resolve; }); };
  await mount("components/forgot-password-form.tsx", "ForgotPasswordForm");
  fill("email", "student@example.edu");
  await submit();
  assert.equal(document.querySelector('button[type="submit"]').disabled, true);
  await submit();
  assert.equal(calls.length, 1);
  await act(async () => finish({ error: null }));
});

test("an expired link cannot reuse an existing signed-in session", async () => {
  window.history.replaceState({}, "", "/reset-password#error=access_denied&error_code=otp_expired");
  auth.initialize = async () => ({ error: new Error("expired link") });
  auth.getUser = async () => { throw new Error("must not inspect a stale session"); };
  await mount("components/reset-password-form.tsx", "ResetPasswordForm");
  assert.match(document.querySelector('[role="alert"]').textContent, /invalid or has expired/);
  assert.equal(document.querySelector('input[type="password"]'), null);
  assert.equal(window.location.hash, "");
  assert.equal(document.querySelector('a[href="/forgot-password"]').textContent, "Request a new reset link");
});

test("visiting the reset page without a session never enables password entry", async () => {
  auth.getUser = async () => ({ data: { user: null }, error: null });
  await mount("components/reset-password-form.tsx", "ResetPasswordForm");
  assert.equal(document.querySelector("form"), null);
  assert.match(document.body.textContent, /Request a new reset link/);
});

test("short or mismatched passwords never reach Supabase", async () => {
  await mount("components/reset-password-form.tsx", "ResetPasswordForm");
  fill("password", "short"); fill("confirmPassword", "short");
  await submit();
  assert.match(document.querySelector('[role="alert"]').textContent, /at least 8/);
  fill("password", "test-value-123"); fill("confirmPassword", "different-value");
  await submit();
  assert.match(document.querySelector('[role="alert"]').textContent, /do not match/);
  assert.equal(calls.length, 0);
});

test("password update reports success only after Supabase accepts it", async () => {
  let finish;
  auth.updateUser = async (payload) => { calls.push(["update", payload]); return new Promise((resolve) => { finish = resolve; }); };
  await mount("components/reset-password-form.tsx", "ResetPasswordForm");
  fill("password", "test-value-123"); fill("confirmPassword", "test-value-123");
  await submit();
  assert.equal(document.querySelector('button[type="submit"]').disabled, true);
  assert.doesNotMatch(document.body.textContent, /Password updated/);
  assert.equal(calls[0][1].password, "test-value-123");
  await act(async () => finish({ error: null }));
  assert.match(document.querySelector('[role="status"]').textContent, /Password updated/);
  assert.equal(document.querySelector("form"), null);
});

test("a rejected new password stays editable and never reports success", async () => {
  auth.updateUser = async () => ({ error: Object.assign(new Error("Password rejected"), { code: "same_password" }) });
  await mount("components/reset-password-form.tsx", "ResetPasswordForm");
  fill("password", "test-value-123"); fill("confirmPassword", "test-value-123");
  await submit();
  assert.match(document.querySelector('[role="alert"]').textContent, /different from your current password/);
  assert.equal(document.querySelector('button[type="submit"]').disabled, false);
  assert.doesNotMatch(document.body.textContent, /Password updated/);
});

test("signing out invalidates the open reset form", async () => {
  await mount("components/reset-password-form.tsx", "ResetPasswordForm");
  await act(async () => handlers.forEach((callback) => callback("SIGNED_OUT", null)));
  assert.equal(document.querySelector("form"), null);
});

test("recovery callbacks on the homepage reach the password page; ordinary logins do not", async () => {
  window.history.replaceState({}, "", "/");
  await mount("components/password-recovery-redirect.tsx", "PasswordRecoveryRedirect");
  handlers.forEach((callback) => callback("SIGNED_IN", { user: { id: "fake-user" } }));
  assert.equal(calls.length, 0);
  handlers.forEach((callback) => callback("PASSWORD_RECOVERY", { user: { id: "fake-user" } }));
  assert.deepEqual(calls, [["replace", "/reset-password"]]);
  window.history.replaceState({}, "", "/reset-password");
  handlers.forEach((callback) => callback("PASSWORD_RECOVERY", { user: { id: "fake-user" } }));
  assert.equal(calls.length, 1, "must not redirect repeatedly on the reset page");
});
