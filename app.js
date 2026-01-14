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

    // Добавляем customer_phone в таблицу orders
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
} catch (err) {
    console.error("DB Init Error:", err);
}

// Обновляем запрос INSERT, чтобы включал телефон
const insertOrder = db.prepare('INSERT INTO orders (customer_email, customer_name, customer_phone) VALUES (?, ?, ?)');
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
    const { customerEmail, customerName, customerPhone, items } = req.body;

    if (!customerEmail || !items || !items.length) {
        return res.status(400).json({ error: "Missing order info" });
    }

    try {
        // Сохранение в БД
        const tx = db.transaction(() => {
            const info = insertOrder.run(customerEmail, customerName || null, customerPhone || null);
            const orderId = Number(info.lastInsertRowid);
            for (const it of items) {
                if (it && it.name) insertItem.run(orderId, it.name, it.desc || null);
            }
            return orderId;
        });
        const orderId = tx();

        // Подготовка данных для письма
        const orderDate = new Date().toLocaleString('ru-RU', { 
            day: '2-digit', month: '2-digit', year: 'numeric', 
            hour: '2-digit', minute: '2-digit' 
        });

        const itemLines = items
            .map((it, i) => `${i + 1}. ${it.name}`)
            .join("\n");

        const subject = `Order Confirmation #${orderId} - TourGuide`;
        const staffEmails = (process.env.STAFF_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);

        const customerText = `
          Hello ${customerName || 'Guest'}!

          Thank you for booking with Gems Of Bergen. Here is your order summary:

          ORDER DETAILS:
          ------------------------------------------
          Order ID:   #${orderId}
          Date:       ${orderDate}
          Customer:   ${customerName || 'Guest'}
          Phone:      ${customerPhone || 'Not provided'}
          ------------------------------------------

          SELECTED TOURS:
          ${itemLines}

          ------------------------------------------
          Total items: ${items.length}

          We will contact you shortly via email or phone to finalize the details.
          Have a great day!
                  `;

                  const staffText = `
          NEW ORDER RECEIVED!
          Order ID: #${orderId}
          Client:   ${customerName || 'Guest'}
          Email:    ${customerEmail}
          Phone:    ${customerPhone || 'None'}
          Date:     ${orderDate}

          Items:
          ${itemLines}
                  `;

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
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Получить все туры из БД
app.get('/api/tours', (req, res) => {
    try {
        const tours = db.prepare('SELECT * FROM tours').all();
        // Парсим JSON текста и картинок, если вы решите хранить их там
        res.json(tours);
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});

// Добавить новый тур
app.post('/api/tours', (req, res) => {
    const { key, title, img, text } = req.body;
    try {
        const stmt = db.prepare('INSERT INTO tours (key, title, img, text) VALUES (?, ?, ?, ?)');
        stmt.run(key, title, img, text);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "Already exists or DB error" });
    }
});

// Удалить тур
app.delete('/api/tours/:key', (req, res) => {
    try {
        db.prepare('DELETE FROM tours WHERE key = ?').run(req.params.key);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: "DB Error" });
    }
});