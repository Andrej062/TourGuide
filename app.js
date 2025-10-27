const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
app.use(express.json());

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
    ('ulriken', 'Ulriken Tour'),
    ('floyen', 'Fløyen Tour'),
    ('nordnes', 'Nordnes Park Tour'),
    ('citycenter', 'Bergen City Center Tour'),
    ('bryggen', 'Bryggen and Fish Market Tour'),
    ('aquarium', 'Bergen Aquarium Tour');
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
        stmt.run(tour_key, user_name || null, comment, stars || 5);
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
