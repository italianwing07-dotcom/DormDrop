const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test, beforeEach, afterEach } = require("node:test");
const ts = require("typescript");
const { JSDOM } = require("jsdom");
const dom = new JSDOM("<!doctype html><div id='root'></div>", { url: "https://dormdrop.example/inbox/thread" });
global.window = dom.window;
global.document = dom.window.document;
global.FormData = dom.window.FormData;
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require("react");
const { act } = React;
const { createRoot } = require("react-dom/client");
let root, client, refreshers, tables, calls, failures, moderator, user, now;

function load(relative, mocks = {}, globals = {}) {
  const filename = path.resolve(__dirname, "..", relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX }
  }).outputText;
  const module = { exports: {} };
  const builtins = {
    "@/lib/supabase/browser-client": { getBrowserSupabaseClient: () => client },
    "next/link": { __esModule: true, default: (props) => React.createElement("a", props) },
    "next/image": { __esModule: true, default: (props) => React.createElement("img", props) },
    "next/navigation": { useParams: () => ({ id: "thread" }), usePathname: () => "/inbox", useRouter: () => ({ push: (url) => calls.push(["navigate", url]), refresh() {} }) },
    ...mocks
  };
  vm.runInNewContext(compiled, {
    exports: module.exports, module, window, document, FormData, Event: window.Event,
    crypto: require("node:crypto").webcrypto, queueMicrotask, URL, File, Blob, console,
    require: (name) => {
      if (builtins[name]) return builtins[name];
      if (name.startsWith("@/")) {
        const file = name.slice(2);
        return load(file + (fs.existsSync(path.resolve(__dirname, "..", file + ".ts")) ? ".ts" : ".tsx"), mocks, globals);
      }
      return require(name);
    }, ...globals
  }, { filename });
  return module.exports;
}

function fakeClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: user ? { user } : null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    rpc: async (fn, args) => {
      calls.push([fn, args]);
      if (fn === "is_moderator") return { data: moderator, error: null };
      if (!moderator) return { error: { code: "42501" } };
      const report = tables.reports.find((row) => row.id === args.report_id);
      report.status = args.action === "remove" ? "resolved" : "reviewed";
      report.reviewed_at = new Date().toISOString();
      tables.hidden_listings = args.action === "remove" ? [{ listing_id: report.listing_id }] : [];
      return { data: null, error: null };
    },
    from(table) {
      let operation = "select", values, filters = [], single = false, options = {}, ascending = true, order;
      const builder = {
        select(_columns, opts = {}) { options = opts; return this; },
        insert(payload) { operation = "insert"; values = payload; return this; },
        update(payload) { operation = "update"; values = payload; return this; },
        delete() { operation = "delete"; return this; },
        eq(key, value) { filters.push((row) => row[key] === value); return this; },
        in(key, list) { filters.push((row) => list.includes(row[key])); return this; },
        or() { return this; },
        order(key, opts) { order = key; ascending = opts.ascending; return this; },
        range() { return this; },
        single() { single = true; return this; },
        maybeSingle() { single = true; return this; },
        then(resolve, reject) {
          return Promise.resolve().then(() => {
            calls.push([table, operation, values]);
            const rows = tables[table] ?? [];
            if (operation === "insert") {
              if (failures[table] === "before") return { data: null, error: { message: "Network unavailable" } };
              if (rows.some((row) => values.id && row.id === values.id)) return { data: null, error: { code: "23505" } };
              const row = { id: "created-" + (++now), created_at: new Date(Date.now() + now).toISOString(), ...values };
              rows.push(row);
              if (failures[table] === "after") return { data: null, error: { message: "Response lost" } };
              return { data: single ? row : [row], error: null };
            }
            let found = rows.filter((row) => filters.every((f) => f(row)));
            if (operation === "update") found.forEach((row) => Object.assign(row, values));
            if (order) found = found.sort((a, b) => String(a[order]).localeCompare(String(b[order])) * (ascending ? 1 : -1));
            return { data: options.head ? null : single ? found[0] ?? null : found.map((row) => ({ ...row })), error: null, count: found.length };
          }).then(resolve, reject);
        }
      };
      return builder;
    }
  };
}

async function mount(file, name, props = {}) {
  const messaging = load("lib/supabase/messaging.ts");
  const Component = load(file, { "@/lib/supabase/messaging": {
    ...messaging,
    watchMessages: (_client, refresh) => { refreshers.add(refresh); void refresh(); return () => refreshers.delete(refresh); }
  } })[name];
  await act(async () => root.render(React.createElement(Component, props)));
}
async function click(text) {
  const button = [...document.querySelectorAll("button")].find((item) => item.textContent === text);
  assert.ok(button, `Button exists: ${text}`);
  await act(async () => button.click());
}
async function fillMessage(value) {
  await act(async () => {
    const element = document.querySelector("textarea");
    Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set.call(element, value);
    element.dispatchEvent(new window.Event("input", { bubbles: true }));
  });
}
beforeEach(() => {
  now = 0; moderator = false; calls = []; failures = {}; refreshers = new Set();
  user = { id: "seller", email_confirmed_at: "2026-09-01" };
  tables = {
    listings: [{ id: "item", title: "Desk lamp", description: "Working lamp", campus: "Rose Hill", category: "For Sale", price: "$10", image_url: "" }],
    conversations: [{ id: "thread", listing_id: "item", buyer_id: "buyer", seller_id: "seller", seller_last_read_at: null, buyer_last_read_at: null }],
    messages: [{ id: "first", conversation_id: "thread", sender_id: "buyer", receiver_id: "seller", content: "Is this available?", created_at: "2026-09-19T12:00:00Z" }],
    reports: [{ id: "report", listing_id: "item", reason: "Spam or scam", details: "Please check this", status: "open", created_at: "2026-09-19T12:00:00Z" }],
    hidden_listings: []
  };
  client = fakeClient();
  root = createRoot(document.getElementById("root"));
});
afterEach(async () => {
  await act(async () => root.unmount());
  assert.equal(refreshers.size, 0, "view subscriptions are cleaned up");
});

test("lost message acknowledgements and retries do not create duplicate messages", async () => {
  const { sendMessage } = load("lib/supabase/messaging.ts");
  failures.messages = "after";
  const payload = { id: "stable-id", conversation_id: "thread", sender_id: "seller", receiver_id: "buyer", content: "Yes it is" };
  const result = await sendMessage(client, payload);
  assert.equal(result.id, "stable-id");
  await sendMessage(client, payload);
  assert.equal(tables.messages.filter((row) => row.id === "stable-id").length, 1);
  assert.equal(calls.filter(([table, op]) => table === "conversations" && op === "update").length, 0);
});

test("a competing tab starting the same conversation is recovered", async () => {
  const { getOrCreateConversation } = load("lib/supabase/messaging.ts");
  tables.conversations = [];
  failures.conversations = "after";
  const conversation = await getOrCreateConversation(client, "item", "buyer", "seller");
  assert.ok(conversation.id);
  assert.equal(tables.conversations.length, 1);
});

test("an unsuccessful reply preserves the thread and draft; retry sends once", async () => {
  await mount("components/conversation-thread.tsx", "ConversationThread");
  await fillMessage("Yes, available for pickup");
  failures.messages = "before";
  await click("Send reply");
  assert.match(document.querySelector('[role="log"]').textContent, /Is this available/);
  assert.equal(document.querySelector("textarea").value, "Yes, available for pickup");
  assert.match(document.querySelector('[role="alert"]').textContent, /couldn't confirm/);
  failures.messages = "after";
  await click("Send reply");
  assert.equal(document.querySelector("textarea").value, "");
  assert.equal(document.querySelector('[role="alert"]'), null);
  assert.equal(tables.messages.length, 2);
  assert.equal(tables.messages[1].receiver_id, "buyer");
  await act(async () => { for (const refresh of refreshers) await refresh(); });
  assert.equal(document.querySelectorAll('[role="log"] > div').length, 2, "refresh deduplicates a just-sent message");
});

test("incoming replies appear while open and logout clears private content", async () => {
  await mount("components/conversation-thread.tsx", "ConversationThread");
  tables.messages.push({ ...tables.messages[0], id: "second", content: "Can I pick up at 2?", created_at: "2026-09-19T12:01:00Z" });
  await act(async () => { for (const refresh of refreshers) await refresh(); });
  assert.match(document.querySelector('[role="log"]').textContent, /pick up at 2/);
  user = null;
  await act(async () => { for (const refresh of refreshers) await refresh(); });
  assert.equal(document.querySelector('[role="log"]'), null);
  assert.match(document.body.textContent, /Sign in to view messages/);
});

test("unread badge changes when messages arrive and after the thread is read", async () => {
  await mount("components/inbox-nav-link.tsx", "InboxNavLink");
  assert.match(document.querySelector('a[href="/inbox"]').textContent, /1/);
  tables.conversations[0].seller_last_read_at = tables.messages[0].created_at;
  await act(async () => { for (const refresh of refreshers) await refresh(); });
  assert.equal(document.querySelector('a[href="/inbox"]').textContent, "Inbox");
  tables.messages.push({ ...tables.messages[0], id: "new", created_at: "2026-09-19T12:01:00Z" });
  await act(async () => { for (const refresh of refreshers) await refresh(); });
  assert.match(document.querySelector('a[href="/inbox"]').textContent, /1/);
});

test("ordinary users see no report contents or moderation controls", async () => {
  await mount("components/moderation-dashboard.tsx", "ModerationDashboard");
  assert.match(document.body.textContent, /admins only/);
  assert.doesNotMatch(document.body.textContent, /Please check this/);
  assert.equal(calls.filter(([table]) => table === "reports").length, 0);
});

test("moderator must confirm removal and can restore a removed listing", async () => {
  moderator = true;
  await mount("components/moderation-dashboard.tsx", "ModerationDashboard");
  assert.match(document.body.textContent, /Please check this/);
  await click("Remove listing");
  assert.equal(calls.filter(([fn]) => fn === "review_report").length, 0);
  await click("Confirm removal");
  assert.equal(tables.reports[0].status, "resolved");
  assert.match(document.body.textContent, /Listing removed from the marketplace/);
  await click("Resolved");
  await click("Restore listing");
  assert.equal(tables.hidden_listings.length, 0);
  assert.equal(tables.reports[0].status, "reviewed");
  assert.match(document.body.textContent, /Listing restored/);
});

test("photo limits reject oversized and non-image files before conversion", () => {
  const { validatePhoto, MAX_SOURCE_BYTES } = load("lib/listing-photos.ts");
  assert.throws(() => validatePhoto({ name: "huge.heic", type: "image/heic", size: MAX_SOURCE_BYTES + 1 }), /20 MB/);
  assert.throws(() => validatePhoto({ name: "script.jpg", type: "text/html", size: 20 }), /Choose a/);
  assert.throws(() => validatePhoto({ name: "empty.png", type: "image/png", size: 0 }), /empty/);
  assert.doesNotThrow(() => validatePhoto({ name: "PHONE.HEIC", type: "", size: 100 }));
});

test("HEIC converts to resized JPEG and releases its preview URL", async () => {
  let converted = 0, revoked = 0, dimensions;
  const canvas = { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }), toBlob(callback) {
    dimensions = [this.width, this.height]; callback(new Blob(["jpeg bytes"], { type: "image/jpeg" }));
  } };
  const { prepareListingPhoto } = load("lib/listing-photos.ts", {
    "heic-to/csp": { heicTo: async () => { converted++; return new Blob(["converted"], { type: "image/jpeg" }); } }
  }, {
    URL: { createObjectURL: () => "blob:photo", revokeObjectURL: () => revoked++ },
    Image: class { naturalWidth = 4000; naturalHeight = 3000; set src(_value) { queueMicrotask(() => this.onload()); } },
    document: { createElement: () => canvas }
  });
  const result = await prepareListingPhoto(new File(["heic bytes"], "phone.heic", { type: "image/heic" }));
  assert.equal(converted, 1); assert.equal(revoked, 1);
  assert.deepEqual(dimensions, [1600, 1200]);
  assert.equal(result.name, "phone.jpg"); assert.equal(result.type, "image/jpeg");
});

test("refresh watcher serializes events, recovers on reconnect and cleans up", async () => {
  const { watchMessages } = load("lib/supabase/messaging.ts");
  let runs = 0, finish, removed = 0, unsubscribed = 0, subscriber;
  const handlers = [];
  const channel = { on(_type, filter, callback) { handlers.push([filter, callback]); return this; }, subscribe(callback) { subscriber = callback; return this; } };
  const watched = { channel: () => channel, removeChannel: async () => removed++, auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => unsubscribed++ } } }) } };
  const stop = watchMessages(watched, async () => { runs++; if (runs === 1) await new Promise((resolve) => { finish = resolve; }); }, { conversationId: "thread" });
  assert.equal(runs, 1);
  handlers[0][1](); handlers[0][1]();
  assert.equal(runs, 1, "overlapping events are queued");
  finish(); await new Promise(setImmediate);
  assert.equal(runs, 2);
  subscriber("SUBSCRIBED"); await new Promise(setImmediate);
  assert.equal(runs, 3);
  assert.equal(handlers[0][0].filter, "conversation_id=eq.thread");
  stop();
  handlers[0][1](); await new Promise(setImmediate);
  assert.equal(runs, 3); assert.equal(removed, 1); assert.equal(unsubscribed, 1);
});
