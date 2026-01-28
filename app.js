const express = require("express");
const path = require("path");
const Database = require("better-sqlite3");
const cors = require("cors");
const { Resend } = require("resend");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cors());

const API_PORT = process.env.PORT || 10000;
const resend = new Resend(process.env.RESEND_API_KEY);

const dbPath = path.join(__dirname, "tourGuide.db");
//const dbPath = process.env.DB_PATH ? path.resolve(process.env.DB_PATH) : path.join(__dirname, "tourGuide.db");
const db = new Database(dbPath);

function ensureToursSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tours (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      img TEXT,
      text TEXT
    );
  `);

  const cols = db.prepare(`PRAGMA table_info(tours)`).all().map((r) => r.name);
  const need = [
    { name: "img", sql: "ALTER TABLE tours ADD COLUMN img TEXT" },
    { name: "text", sql: "ALTER TABLE tours ADD COLUMN text TEXT" },
  ];

  for (const c of need) {
    if (!cols.includes(c.name)) {
      try {
        db.exec(c.sql);
      } catch (e) {}
    }
  }
}

function ensureBaseSchema() {
  ensureToursSchema();

  db.exec(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tour_key TEXT NOT NULL,
      user_name TEXT,
      comment TEXT NOT NULL,
      stars INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_email TEXT NOT NULL,
      customer_name TEXT,
      customer_phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      item_desc TEXT
    );
  `);
}

ensureBaseSchema();

const insertOrder = db.prepare(
  "INSERT INTO orders (customer_email, customer_name, customer_phone) VALUES (?, ?, ?)"
);
const insertItem = db.prepare(
  "INSERT INTO order_items (order_id, item_name, item_desc) VALUES (?, ?, ?)"
);

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/tours", (req, res) => {
  try {
    const rows = db.prepare("SELECT key, title, img, text FROM tours ORDER BY rowid DESC").all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/tours", (req, res) => {
  const key = String(req.body?.key || "").trim();
  const title = String(req.body?.title || "").trim();
  const img = String(req.body?.img || "").trim();
  const text = String(req.body?.text || "").trim();

  if (!key || !title) return res.status(400).json({ error: "Missing key/title" });

  try {
    db.prepare("INSERT INTO tours (key, title, img, text) VALUES (?, ?, ?, ?)").run(
      key,
      title,
      img || null,
      text || null
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: "Already exists or DB error" });
  }
});

app.delete("/api/tours/:key", (req, res) => {
  const key = String(req.params.key || "").trim();
  if (!key) return res.status(400).json({ error: "Missing key" });

  try {
    db.prepare("DELETE FROM tours WHERE key = ?").run(key);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "DB Error" });
  }
});

app.get("/api/reviews/:tour", (req, res) => {
  try {
    const tour = String(req.params.tour || "").trim();
    const rows = db
      .prepare("SELECT * FROM reviews WHERE tour_key = ? ORDER BY created_at DESC")
      .all(tour);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/reviews", (req, res) => {
  const tour_key = String(req.body?.tour_key || "").trim();
  const user_name = String(req.body?.user_name || "").trim();
  const comment = String(req.body?.comment || "").trim();
  const starsNum = Number(req.body?.stars);

  const stars = Number.isFinite(starsNum) ? Math.max(1, Math.min(5, Math.round(starsNum))) : 5;

  if (!tour_key || !comment) return res.status(400).json({ error: "Missing review info" });

  try {
    db.prepare("INSERT INTO reviews (tour_key, user_name, comment, stars) VALUES (?,?,?,?)").run(
      tour_key,
      user_name || null,
      comment,
      stars
    );
    console.log(tour_key, user_name, comment, stars);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "DB Error" });
  }
});

app.delete("/api/reviews/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Bad id" });

  try {
    db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "DB Error" });
  }
});

app.post("/api/orders", async (req, res) => {
  const customerEmail = String(req.body?.customerEmail || "").trim();
  const customerName = String(req.body?.customerName || "").trim();
  const customerPhone = String(req.body?.customerPhone || "").trim();
  const items = Array.isArray(req.body?.items) ? req.body.items : [];

  const cleanItems = items
    .map((it) => ({
      name: String(it?.name || "").trim(),
      desc: String(it?.desc || "").trim(),
    }))
    .filter((it) => it.name);

  if (!customerEmail || !cleanItems.length) {
    return res.status(400).json({ ok: false, error: "Missing order info" });
  }

  try {
    const orderId = db.transaction(() => {
      const info = insertOrder.run(customerEmail, customerName || null, customerPhone || null);
      const id = Number(info.lastInsertRowid);
      for (const it of cleanItems) insertItem.run(id, it.name, it.desc || null);
      return id;
    })();

    const orderDate = new Date().toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const itemLines = cleanItems.map((it, i) => `${i + 1}. ${it.name}`).join("\n");

    const staffEmails = String(process.env.STAFF_EMAILS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const subject = `Order Confirmation #${orderId} - TourGuide`;

    const customerText = `
Hello ${customerName || "Guest"}!

Thank you for booking with Gems Of Bergen. Here is your order summary:

ORDER DETAILS:
------------------------------------------
Order ID:   #${orderId}
Date:       ${orderDate}
Customer:   ${customerName || "Guest"}
Phone:      ${customerPhone || "Not provided"}
------------------------------------------

SELECTED TOURS:
${itemLines}

------------------------------------------
Total items: ${cleanItems.length}

We will contact you shortly via email or phone to finalize the details.
Have a great day!
`.trim();

    const staffText = `
NEW ORDER RECEIVED!
Order ID: #${orderId}
Client:   ${customerName || "Guest"}
Email:    ${customerEmail}
Phone:    ${customerPhone || "None"}
Date:     ${orderDate}

Items:
${itemLines}
`.trim();

    try {
      if (process.env.RESEND_API_KEY) {
        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: customerEmail,
          subject,
          text: customerText,
        });

        if (staffEmails.length) {
          await resend.emails.send({
            from: "onboarding@resend.dev",
            to: staffEmails,
            subject: `[STAFF] New Order #${orderId}`,
            text: staffText,
          });
        }
      } else {
        return res.json({ ok: true, orderId, mailWarning: true });
      }
    } catch (e) {
      return res.json({ ok: true, orderId, mailWarning: true });
    }

    res.json({ ok: true, orderId });
  } catch (e) {
    console.error("Order process error:", e);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

app.use(express.static(__dirname));

app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(API_PORT, () => console.log(`Server is running on port ${API_PORT}`));
