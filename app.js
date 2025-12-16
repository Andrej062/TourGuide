const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

const cors = require('cors');
app.use(cors());

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

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
