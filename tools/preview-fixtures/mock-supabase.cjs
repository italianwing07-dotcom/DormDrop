// Local stand-in for the Supabase REST/auth/storage API, used only to render
// DormLoot screens with realistic data for visual review and journey testing.
// Implements the PostgREST and GoTrue subset this app actually calls.
const http = require("node:http");
const { randomUUID } = require("node:crypto");

const PORT = Number(process.env.MOCK_PORT || 54321);

const USERS = {
  seller: { id: "11111111-1111-4111-8111-111111111111", email: "mariana.okonkwo@fordham.edu" },
  buyer: { id: "22222222-2222-4222-8222-222222222222", email: "devin.ramaswamy@fordham.edu" },
  outsider: { id: "33333333-3333-4333-8333-333333333333", email: "priya.caldwell@fordham.edu" }
};

const img = (seed) => `http://localhost:${PORT}/fixture-photo/${seed}.jpg`;

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString();
}

const db = {
  listings: [
    {
      id: "a0000000-0000-4000-8000-000000000001", user_id: USERS.seller.id,
      title: "Mini fridge, 3.2 cu ft, works perfectly",
      description: "Used it for two years in Walsh. Cools fast and the freezer box still works.\n\nPickup at Walsh Hall any evening this week. Cleaned and defrosted already.",
      price: "65.00", category: "For Sale", campus: "Rose Hill",
      image_url: img("fridge-a"), image_urls: [img("fridge-a"), img("fridge-b"), img("fridge-c")],
      seller_email: USERS.seller.email, sold: false, created_at: hoursAgo(5)
    },
    {
      id: "a0000000-0000-4000-8000-000000000002", user_id: USERS.outsider.id,
      title: "IKEA desk lamp, warm bulb included",
      description: "Clip-on lamp, barely used. Bulb is a warm 2700K so it does not feel like a hospital.",
      price: "0", category: "Free", campus: "Lincoln Center",
      image_url: img("lamp-a"), image_urls: [img("lamp-a")],
      seller_email: USERS.outsider.email, sold: false, created_at: hoursAgo(19)
    },
    {
      id: "a0000000-0000-4000-8000-000000000003", user_id: USERS.outsider.id,
      title: "Organic Chemistry textbook, 8th edition",
      description: "Klein 8th edition. Some highlighting in the first four chapters, nothing after that.",
      price: "40", category: "For Sale", campus: "Rose Hill",
      image_url: img("books-a"), image_urls: [img("books-a"), img("books-b")],
      seller_email: USERS.outsider.email, sold: false, created_at: hoursAgo(27)
    },
    {
      id: "a0000000-0000-4000-8000-000000000004", user_id: USERS.seller.id,
      title: "Storage bins, set of four",
      description: "Four stackable bins that fit under a standard lofted bed.",
      price: "18", category: "For Sale", campus: "Rose Hill",
      image_url: img("bins-a"), image_urls: [img("bins-a")],
      seller_email: USERS.seller.email, sold: true, created_at: hoursAgo(50)
    },
    {
      id: "a0000000-0000-4000-8000-000000000005", user_id: USERS.buyer.id,
      title: "Looking for a full length mirror",
      description: "Moving into McMahon and need a mirror that leans against the wall.",
      price: "0", category: "Wanted", campus: "Lincoln Center",
      image_url: "", image_urls: [],
      seller_email: USERS.buyer.email, sold: false, created_at: hoursAgo(62)
    },
    {
      id: "a0000000-0000-4000-8000-000000000006", user_id: USERS.outsider.id,
      title: "Desk chair with adjustable height",
      description: "Rolls fine, one armrest is a little scuffed. Great for long paper nights.",
      price: "25", category: "For Sale", campus: "Lincoln Center",
      image_url: img("chair-a"), image_urls: [img("chair-a"), img("chair-b")],
      seller_email: USERS.outsider.email, sold: false, created_at: hoursAgo(73)
    },
    {
      id: "a0000000-0000-4000-8000-000000000007", user_id: USERS.seller.id,
      title: "Microwave, 700W, clean inside",
      description: "Standard dorm microwave. Turntable included, no rust.",
      price: "30", category: "For Sale", campus: "Rose Hill",
      image_url: img("microwave-a"), image_urls: [img("microwave-a")],
      seller_email: USERS.seller.email, sold: false, created_at: hoursAgo(90)
    }
  ],
  conversations: [
    {
      id: "c0000000-0000-4000-8000-000000000001",
      listing_id: "a0000000-0000-4000-8000-000000000001",
      buyer_id: USERS.buyer.id, seller_id: USERS.seller.id,
      buyer_last_read_at: hoursAgo(1), seller_last_read_at: null,
      last_message_at: hoursAgo(0.2), created_at: hoursAgo(3)
    },
    {
      id: "c0000000-0000-4000-8000-000000000002",
      listing_id: "a0000000-0000-4000-8000-000000000003",
      buyer_id: USERS.seller.id, seller_id: USERS.outsider.id,
      buyer_last_read_at: hoursAgo(20), seller_last_read_at: hoursAgo(20),
      last_message_at: hoursAgo(20), created_at: hoursAgo(22)
    }
  ],
  messages: [
    { id: "d0000000-0000-4000-8000-000000000001", conversation_id: "c0000000-0000-4000-8000-000000000001", sender_id: USERS.buyer.id, receiver_id: USERS.seller.id, content: "Hi, is the fridge still available?", created_at: hoursAgo(3) },
    { id: "d0000000-0000-4000-8000-000000000002", conversation_id: "c0000000-0000-4000-8000-000000000001", sender_id: USERS.seller.id, receiver_id: USERS.buyer.id, content: "Yes it is. I am in Walsh, can do any evening this week after 6.", created_at: hoursAgo(2.5) },
    { id: "d0000000-0000-4000-8000-000000000003", conversation_id: "c0000000-0000-4000-8000-000000000001", sender_id: USERS.buyer.id, receiver_id: USERS.seller.id, content: "Thursday around 7 works for me. Does it fit under a lofted bed?", created_at: hoursAgo(0.4) },
    { id: "d0000000-0000-4000-8000-000000000004", conversation_id: "c0000000-0000-4000-8000-000000000001", sender_id: USERS.buyer.id, receiver_id: USERS.seller.id, content: "Also, is the freezer section usable or mostly iced over?", created_at: hoursAgo(0.2) },
    { id: "d0000000-0000-4000-8000-000000000005", conversation_id: "c0000000-0000-4000-8000-000000000002", sender_id: USERS.seller.id, receiver_id: USERS.outsider.id, content: "Is the Klein textbook the one with the solutions manual?", created_at: hoursAgo(22) },
    { id: "d0000000-0000-4000-8000-000000000006", conversation_id: "c0000000-0000-4000-8000-000000000002", sender_id: USERS.outsider.id, receiver_id: USERS.seller.id, content: "No manual, just the textbook itself.", created_at: hoursAgo(20) }
  ],
  saved_listings: [
    { user_id: USERS.buyer.id, listing_id: "a0000000-0000-4000-8000-000000000003", created_at: hoursAgo(10) },
    { user_id: USERS.buyer.id, listing_id: "a0000000-0000-4000-8000-000000000006", created_at: hoursAgo(12) }
  ],
  reports: [
    { id: "e0000000-0000-4000-8000-000000000001", listing_id: "a0000000-0000-4000-8000-000000000006", reporter_id: USERS.buyer.id, reason: "Incorrect information", details: "Listing says Lincoln Center but the description mentions pickup at Rose Hill.", status: "open", created_at: hoursAgo(4), reviewed_at: null, reviewed_by: null }
  ],
  hidden_listings: [],
  moderators: [{ user_id: USERS.seller.id, created_at: hoursAgo(300) }]
};

// Fixture photography stand-ins. Varied luminance so badge/overlay contrast can be judged.
const PHOTOS = {
  "fridge-a": ["#d8dde3", "#aab4c0", "Mini fridge"], "fridge-b": ["#2f3640", "#4b5563", "Mini fridge open"],
  "fridge-c": ["#e9e4da", "#c7bdae", "Freezer box"], "lamp-a": ["#f3ead9", "#d9c7a3", "Desk lamp"],
  "books-a": ["#8d5a3b", "#5d3826", "Textbook"], "books-b": ["#c9b79c", "#9c876c", "Textbook pages"],
  "bins-a": ["#cfd8dc", "#9aa7ad", "Storage bins"], "chair-a": ["#3b3f46", "#23262b", "Desk chair"],
  "chair-b": ["#6b7280", "#4b5563", "Chair base"], "microwave-a": ["#e5e7eb", "#b0b6bd", "Microwave"]
};

const zlib = require("node:zlib");

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = c ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Real PNG bytes so the app sees genuine raster photos, with a diagonal gradient,
// film-grain noise and a soft vignette so crops and overlay contrast read honestly.
function photoPng(seed) {
  const [fromHex, toHex] = PHOTOS[seed] || ["#d4d4d8", "#a1a1aa"];
  const [r1, g1, b1] = hexToRgb(fromHex);
  const [r2, g2, b2] = hexToRgb(toHex);
  const W = 800, H = 600;
  let rng = 0;
  for (let i = 0; i < seed.length; i++) rng = (rng * 31 + seed.charCodeAt(i)) >>> 0;
  const rand = () => ((rng = (rng * 1664525 + 1013904223) >>> 0) / 4294967296);

  const raw = Buffer.alloc((W * 3 + 1) * H);
  let p = 0;
  for (let y = 0; y < H; y++) {
    raw[p++] = 0;
    for (let x = 0; x < W; x++) {
      const t = (x / W) * 0.6 + (y / H) * 0.4;
      const dx = x / W - 0.5, dy = y / H - 0.5;
      const vignette = 1 - Math.min(1, (dx * dx + dy * dy) * 1.1);
      const grain = (rand() - 0.5) * 16;
      raw[p++] = Math.max(0, Math.min(255, (r1 + (r2 - r1) * t) * vignette + grain));
      raw[p++] = Math.max(0, Math.min(255, (g1 + (g2 - g1) * t) * vignette + grain));
      raw[p++] = Math.max(0, Math.min(255, (b1 + (b2 - b1) * t) * vignette + grain));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 6 })),
    pngChunk("IEND", Buffer.alloc(0))
  ]);
}

const uploads = new Map();
const PRISTINE = JSON.stringify(db);
function resetDb() {
  const fresh = JSON.parse(PRISTINE);
  for (const key of Object.keys(fresh)) db[key] = fresh[key];
  uploads.clear();
}

function parseFilterValue(raw) {
  if (raw === "null") return null;
  if (raw === "true") return true;
  if (raw === "false") return false;
  return raw;
}

function matchesOp(rowValue, op, rawValue) {
  switch (op) {
    case "eq": return String(rowValue) === String(parseFilterValue(rawValue));
    case "neq": return String(rowValue) !== String(parseFilterValue(rawValue));
    case "is": {
      const v = parseFilterValue(rawValue);
      return v === null ? rowValue === null || rowValue === undefined : rowValue === v;
    }
    case "in": {
      const list = rawValue.replace(/^\(|\)$/g, "").split(",").map((s) => s.replace(/^"|"$/g, ""));
      return list.includes(String(rowValue));
    }
    case "gt": return rowValue > parseFilterValue(rawValue);
    case "gte": return rowValue >= parseFilterValue(rawValue);
    case "lt": return rowValue < parseFilterValue(rawValue);
    case "lte": return rowValue <= parseFilterValue(rawValue);
    default: return true;
  }
}

// `or=(buyer_id.eq.X,seller_id.eq.Y)`
function matchesOr(row, expr) {
  const inner = expr.replace(/^\(|\)$/g, "");
  return inner.split(",").some((clause) => {
    const [col, op, ...rest] = clause.split(".");
    return matchesOp(row[col], op, rest.join("."));
  });
}

function applyQuery(rows, params) {
  let out = rows.slice();
  for (const [key, value] of params.entries()) {
    if (["select", "order", "limit", "offset", "columns", "on_conflict"].includes(key)) continue;
    if (key === "or") { out = out.filter((r) => matchesOr(r, value)); continue; }
    const [op, ...rest] = value.split(".");
    out = out.filter((r) => matchesOp(r[key], op, rest.join(".")));
  }
  const order = params.get("order");
  if (order) {
    for (const clause of order.split(",").reverse()) {
      const [col, dir] = clause.split(".");
      out.sort((a, b) => {
        const av = a[col] ?? "", bv = b[col] ?? "";
        if (av === bv) return 0;
        return (av > bv ? 1 : -1) * (dir === "desc" ? -1 : 1);
      });
    }
  }
  const limit = params.get("limit");
  if (limit) out = out.slice(0, Number(limit));
  return out;
}

function send(res, status, body, headers = {}) {
  const payload = body === null ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "*",
    "access-control-expose-headers": "content-range, x-mock",
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,HEAD,OPTIONS",
    ...headers
  });
  res.end(payload);
}

function session(user) {
  return {
    access_token: "mock-access-token-" + user.id,
    token_type: "bearer", expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "mock-refresh-" + user.id,
    user: {
      id: user.id, aud: "authenticated", role: "authenticated", email: user.email,
      email_confirmed_at: hoursAgo(500), phone: "", confirmed_at: hoursAgo(500),
      last_sign_in_at: hoursAgo(1), app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {}, identities: [], created_at: hoursAgo(500), updated_at: hoursAgo(1)
    }
  };
}

function userByToken(req) {
  const auth = req.headers.authorization || "";
  const id = auth.replace("Bearer mock-access-token-", "").trim();
  return Object.values(USERS).find((u) => u.id === id) || null;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const path = url.pathname;

  if (req.method === "OPTIONS") return send(res, 204, null);

  if (path === "/__reset") { resetDb(); return send(res, 200, { reset: true }); }

  if (path.startsWith("/fixture-photo/")) {
    const seed = path.split("/").pop().replace(/\.(jpg|png|svg)$/, "");
    res.writeHead(200, { "content-type": "image/png", "cache-control": "no-store", "access-control-allow-origin": "*" });
    return res.end(photoPng(seed));
  }

  let body = null;
  if (["POST", "PATCH", "PUT"].includes(req.method)) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    const raw = Buffer.concat(chunks);
    if ((req.headers["content-type"] || "").includes("application/json")) {
      try { body = JSON.parse(raw.toString() || "null"); } catch { body = null; }
    } else { body = raw; }
  }

  // ---- GoTrue subset ----
  if (path.startsWith("/auth/v1/")) {
    const action = path.replace("/auth/v1/", "");
    if (action === "token") {
      const email = String(body?.email || "").toLowerCase();
      const found = Object.values(USERS).find((u) => u.email === email);
      if (!found) return send(res, 400, { error: "invalid_grant", error_description: "Invalid login credentials" });
      return send(res, 200, session(found));
    }
    if (action === "user" && req.method === "GET") {
      const u = userByToken(req);
      if (!u) return send(res, 401, { message: "Auth session missing!" });
      return send(res, 200, session(u).user);
    }
    if (action === "user" && req.method === "PUT") {
      const u = userByToken(req);
      if (!u) return send(res, 401, { message: "Auth session missing!" });
      return send(res, 200, session(u).user);
    }
    if (action === "logout") return send(res, 204, null);
    if (action === "signup") return send(res, 200, { ...session(USERS.buyer), session: null });
    if (action === "recover" || action === "resend") return send(res, 200, {});
    return send(res, 200, {});
  }

  // ---- Storage subset ----
  if (path.startsWith("/storage/v1/object/")) {
    const objectPath = path.replace("/storage/v1/object/", "").replace(/^public\//, "");
    if (req.method === "POST" || req.method === "PUT") {
      uploads.set(objectPath, body);
      return send(res, 200, { Key: objectPath, Id: randomUUID() });
    }
    if (req.method === "DELETE") { uploads.delete(objectPath); return send(res, 200, []); }
    const stored = uploads.get(objectPath);
    if (!stored) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": "image/jpeg", "access-control-allow-origin": "*" });
    return res.end(stored);
  }

  // ---- PostgREST subset ----
  if (path.startsWith("/rest/v1/")) {
    const table = path.replace("/rest/v1/", "").split("?")[0];
    if (!db[table]) return send(res, 404, { message: `relation "${table}" does not exist` });

    const wantsObject = (req.headers.accept || "").includes("pgrst.object");
    const prefer = req.headers.prefer || "";
    const wantsCount = prefer.includes("count=exact");

    if (req.method === "GET" || req.method === "HEAD") {
      const rows = applyQuery(db[table], url.searchParams);
      const headers = wantsCount
        ? { "content-range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}` }
        : {};
      if (req.method === "HEAD") { res.writeHead(200, { ...headers, "access-control-allow-origin": "*", "access-control-expose-headers": "content-range" }); return res.end(); }
      if (wantsObject) {
        if (rows.length !== 1) {
          return send(res, 406, { code: "PGRST116", details: `The result contains ${rows.length} rows`, hint: null, message: "JSON object requested, multiple (or no) rows returned" });
        }
        return send(res, 200, rows[0], headers);
      }
      return send(res, 200, rows, headers);
    }

    if (req.method === "POST") {
      const incoming = Array.isArray(body) ? body : [body];
      const created = incoming.map((row) => {
        const complete = { id: row.id || randomUUID(), created_at: new Date().toISOString(), ...row };
        const conflictKeys = table === "saved_listings" ? ["user_id", "listing_id"] : ["id"];
        const dup = db[table].find((r) => conflictKeys.every((k) => r[k] === complete[k]));
        if (dup) {
          if (url.searchParams.get("on_conflict") || prefer.includes("resolution=")) return dup;
          const err = new Error("duplicate key value violates unique constraint");
          err.code = "23505";
          throw err;
        }
        db[table].push(complete);
        if (table === "messages") {
          const convo = db.conversations.find((c) => c.id === complete.conversation_id);
          if (convo) convo.last_message_at = complete.created_at;
        }
        return complete;
      });
      try {
        if (wantsObject) return send(res, 201, created[0]);
        return send(res, 201, prefer.includes("return=representation") ? created : null);
      } catch { /* handled below */ }
    }

    if (req.method === "PATCH") {
      const rows = applyQuery(db[table], url.searchParams);
      rows.forEach((r) => Object.assign(r, body));
      if (wantsObject) {
        if (rows.length !== 1) return send(res, 406, { code: "PGRST116", details: `The result contains ${rows.length} rows`, message: "JSON object requested, multiple (or no) rows returned" });
        return send(res, 200, rows[0]);
      }
      return send(res, 200, prefer.includes("return=representation") ? rows : null);
    }

    if (req.method === "DELETE") {
      const rows = applyQuery(db[table], url.searchParams);
      db[table] = db[table].filter((r) => !rows.includes(r));
      return send(res, 200, prefer.includes("return=representation") ? rows : null);
    }
  }

  send(res, 404, { message: "not found", path });
});

server.listen(PORT, () => {
  console.log(`mock supabase listening on http://localhost:${PORT}`);
  console.log(`users: ${Object.entries(USERS).map(([k, v]) => `${k}=${v.email}`).join("  ")}`);
});
