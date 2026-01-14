const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
app.use(express.json());
app.use(cors());

const resend = new Resend(process.env.RESEND_API_KEY);

const dbPath = path.join(__dirname, 'tourGuide.db');
let db;

try {
    db = new Database(dbPath);
    console.log('Connected to database');

    db.exec(`
        CREATE TABLE IF NOT EXISTS tours (key TEXT PRIMARY KEY, title TEXT NOT NULL);
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
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            item_name TEXT NOT NULL,
            item_desc TEXT
        );
    `);
} catch (err) {
    console.error("DB Init Error:", err);
}

const insertOrder = db.prepare('INSERT INTO orders (customer_email, customer_name) VALUES (?, ?)');
const insertItem = db.prepare('INSERT INTO order_items (order_id, item_name, item_desc) VALUES (?, ?, ?)');

app.get('/api/reviews/:tour', (req, res) => {
    try {
        const stmt = db.prepare('SELECT * FROM reviews WHERE tour_key = ? ORDER BY created_at DESC');
        res.json(stmt.all(req.params.tour));
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.post('/api/reviews', (req, res) => {
    const { tour_key, user_name, comment, stars } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO reviews (tour_key, user_name, comment, stars) VALUES (?,?,?,?)');
        stmt.run(tour_key, user_name || null, comment, stars || 5);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

app.post('/api/orders', async (req, res) => {
    const { customerEmail, customerName, items } = req.body;

    if (!customerEmail || !items || !items.length) {
        return res.status(400).json({ error: "Missing order info" });
    }

    try {
        const tx = db.transaction(() => {
            const info = insertOrder.run(customerEmail, customerName || null);
            const orderId = Number(info.lastInsertRowid);
            for (const it of items) {
                if (it && it.name) insertItem.run(orderId, it.name, it.desc || null);
            }
            return orderId;
        });
        const orderId = tx();

        const createdAt = new Date().toLocaleString();
        const itemLines = items
            .map((it, i) => `${i + 1}. ${it.name}`)
            .join("\n");

        const subject = `TourGuide receipt #${orderId}`;
        const staffEmails = (process.env.STAFF_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);

        const customerText = `Thanks for your order!\n\nID: ${orderId}\nItems:\n${itemLines}`;
        const staffText = `New order #${orderId}\nCustomer: ${customerEmail}\nItems:\n${itemLines}`;

        try {
            await resend.emails.send({
                from: 'onboarding@resend.dev',
                to: customerEmail,
                subject: subject,
                text: customerText,
            });

            if (staffEmails.length) {
                await resend.emails.send({
                    from: 'onboarding@resend.dev',
                    to: staffEmails,
                    subject: `[STAFF] New Order #${orderId}`,
                    text: staffText,
                });
            }
        } catch (mailErr) {
            console.error("Resend Error:", mailErr);
            return res.json({ ok: true, orderId, mailWarning: true });
        }

        res.json({ ok: true, orderId });

    } catch (err) {
        console.error("Order process error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

app.use(express.static(__dirname));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));