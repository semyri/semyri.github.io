const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

let db; // Declare db outside the connection to have wider scope

// Initialize SQLite database
const dbPromise = new Promise((resolve, reject) => {
    db = new sqlite3.Database('churchbook.db', (err) => {
        if (err) {
            console.error("Database connection error:", err.message); // Log the error
            reject(err);
            return;
        }
        console.log('Connected to the churchbook database.');
        resolve(db);
    });
});

dbPromise.then(() => {
    // Create the members table if it doesn't exist (only after successful connection)
    db.run(`
        CREATE TABLE IF NOT EXISTS members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            phone TEXT,
            address TEXT,
            email TEXT,
            notes TEXT
        )
    `);

    // API endpoints (only after successful database connection)
    app.get('/api/members', (req, res) => {
        db.all('SELECT * FROM members', [], (err, rows) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json(rows);
        });
    });

    app.get('/api/members/:id', (req, res) => {
        const id = req.params.id;
        db.get('SELECT * FROM members WHERE id = ?', [id], (err, row) => {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            if (!row) {
                res.status(404).send('Member not found');
                return;
            }
            res.json(row);
        });
    });

    app.post('/api/members', (req, res) => {
        const { name, phone, address, email, notes } = req.body;
        db.run(`INSERT INTO members (name, phone, address, email, notes) VALUES (?, ?, ?, ?, ?)`, [name, phone, address, email, notes], function(err) {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json({ id: this.lastID }); // Send back the ID of the newly added member
        });
    });

    app.put('/api/members/:id', (req, res) => {
        const id = req.params.id;
        const { name, phone, address, email, notes } = req.body;
        db.run(`
            UPDATE members
            SET name = ?, phone = ?, address = ?, email = ?, notes = ?
            WHERE id = ?
        `, [name, phone, address, email, notes, id], function(err) {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json({ message: `Member with ID ${id} updated.` });
        });
    });

    app.delete('/api/members/:id', (req, res) => {
        const id = req.params.id;
        db.run('DELETE FROM members WHERE id = ?', [id], function(err) {
            if (err) {
                res.status(500).send(err.message);
                return;
            }
            res.json({ message: `Member with ID ${id} deleted.` });
        });
    });
}).catch(error => {
    console.error("Failed to initialize database:", error);
});

// Serve the index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});