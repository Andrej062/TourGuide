const nodemailer = require('nodemailer');
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT || 465),
  secure: String(process.env.SMTP_SECURE || "true") === "true", // true для 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 20000,
  greetingTimeout: 20000,
  socketTimeout: 20000,
});

mailer.verify()
  .then(() => console.log("SMTP OK"))
  .catch((e) => console.log("SMTP VERIFY FAIL:", e.message));

const dbPath = path.join(__dirname, 'tourGuide.db');
let db;

try {
    db = new Database(dbPath);
    console.log('Connected to database');

    db.exec(`
    CREATE TABLE IF NOT EXISTS tours (
        key TEXT PRIMARY KEY,
        title TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tour_key TEXT NOT NULL,
        user_name TEXT,
        comment TEXT NOT NULL,
        stars INTEGER CHECK(stars >= 1 AND stars <= 5),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_key) REFERENCES tours(key)
    );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_email TEXT NOT NULL,
    customer_name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    item_name TEXT NOT NULL,
    item_desc TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
  );
`);

db.exec(`
    INSERT OR IGNORE INTO tours (key, title) VALUES
    ('trollskogen', 'trollskogen'),
    ('cinnamunBun', 'Cinnamun Bun Tour'),
    ('shopTour', 'Shop Tour'),
    ('brownCheese', 'Brown Cheese Tour'),
    ('streetArt', 'Street Art Tour'),
    ('instagramTour', 'Instagram Tour');
`);



    console.log("Tables ensured.");
} catch (err) {
    console.error("DB Init Error:", err);
}
  

app.get('/api/reviews/:tour', (req, res) => {
    const tour = req.params.tour;
    try {
        const stmt = db.prepare('SELECT * FROM reviews WHERE tour_key = ? ORDER BY created_at DESC');
        const rows = stmt.all(tour);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB Error" });
    }
});

app.post('/api/reviews', (req, res) => {
    const { tour_key, user_name, comment, stars } = req.body;

    if (!tour_key || !comment) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const stmt = db.prepare(`
            INSERT INTO reviews (tour_key, user_name, comment, stars)
            VALUES (?,?,?,?)
        `);
        let st = Number.parseInt(stars, 10);
        if (!Number.isFinite(st)) st = 5;
        st = Math.min(5, Math.max(1, st));

        stmt.run(tour_key, user_name || null, comment, st);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "DB Error" });
    }
});

app.delete('/api/reviews/:id', (req, res) => {
  const id = req.params.id;
  try {
    const stmt = db.prepare('DELETE FROM reviews WHERE id = ?');
    const info = stmt.run(id);

    if (info.changes === 0) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "DB Error" });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customerEmail, customerName, items } = req.body;

    if (!customerEmail || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing email or items" });
    }

    const insertOrder = db.prepare(
      "INSERT INTO orders (customer_email, customer_name) VALUES (?, ?)"
    );
    const insertItem = db.prepare(
      "INSERT INTO order_items (order_id, item_name, item_desc) VALUES (?, ?, ?)"
    );

    const tx = db.transaction(() => {
      const info = insertOrder.run(customerEmail, customerName || null);
      const orderId = Number(info.lastInsertRowid);

      for (const it of items) {
        if (!it || !it.name) continue;
        insertItem.run(orderId, String(it.name), it.desc ? String(it.desc) : null);
      }
      return orderId;
    });

    const orderId = tx();

    const createdAt = new Date().toISOString();
    const itemLines = items
      .filter(it => it && it.name)
      .map((it, i) => `${i + 1}. ${it.name}${it.desc ? ` — ${it.desc}` : ""}`)
      .join("\n");

    const subject = `TourGuide receipt #${orderId}`;
    const from = process.env.MAIL_FROM || process.env.SMTP_USER;

    const staffTo = (process.env.STAFF_EMAILS || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const customerText =
      `Thanks for your order!\n\n` +
      `Order ID: ${orderId}\n` +
      `Time: ${createdAt}\n` +
      `Email: ${customerEmail}\n` +
      (customerName ? `Name: ${customerName}\n` : "") +
      `\nItems:\n${itemLines}\n\n` +
      `We will contact you soon.`;

    const staffText =
      `New order received!\n\n` +
      `Order ID: ${orderId}\n` +
      `Time: ${createdAt}\n` +
      `Customer email: ${customerEmail}\n` +
      (customerName ? `Customer name: ${customerName}\n` : "") +
      `\nItems:\n${itemLines}`;

    try {
      await mailer.sendMail({
        from,
        to: customerEmail,
        subject,
        text: customerText,
      });

      if (staffTo.length) {
        await mailer.sendMail({
          from,
          to: staffTo,
          subject: `[STAFF] Order #${orderId}`,
          text: staffText,
        });
      }
    } catch (mailErr) {
      console.error("Mail error:", mailErr);
      return res.status(200).json({ ok: true, orderId, mailWarning: true });
    }

    res.json({ ok: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

