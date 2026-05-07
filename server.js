const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
const db = new sqlite3.Database('./library.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

// Create tables
function createTables() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        available INTEGER DEFAULT 1
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS issued_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        book_id INTEGER,
        issue_date TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (book_id) REFERENCES books (id)
    )`);

    // Insert sample books if not exists
    db.get("SELECT COUNT(*) as count FROM books", (err, row) => {
        if (row.count === 0) {
            const sampleBooks = ["DBMS", "Operating System", "Data Structures", "Java", "Python"];
            sampleBooks.forEach(book => {
                db.run("INSERT INTO books (title) VALUES (?)", [book]);
            });
        }
    });
}

// API Routes

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username } = req.body;
    if (!username) {
        return res.status(400).json({ error: 'Username is required' });
    }

    db.run("INSERT OR IGNORE INTO users (username) VALUES (?)", [username], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Login successful', userId: this.lastID });
    });
});

// Get available books
app.get('/api/books', (req, res) => {
    db.all("SELECT * FROM books WHERE available = 1", (err, rows) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Issue book
app.post('/api/issue', (req, res) => {
    const { username, bookTitle } = req.body;
    if (!username || !bookTitle) {
        return res.status(400).json({ error: 'Username and book title are required' });
    }

    // Get user id
    db.get("SELECT id FROM users WHERE username = ?", [username], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: 'User not found' });
        }

        // Get book id
        db.get("SELECT id FROM books WHERE title = ? AND available = 1", [bookTitle], (err, book) => {
            if (err || !book) {
                return res.status(400).json({ error: 'Book not available' });
            }

            // Issue book
            db.run("INSERT INTO issued_books (user_id, book_id) VALUES (?, ?)", [user.id, book.id], (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Database error' });
                }

                // Mark book as unavailable
                db.run("UPDATE books SET available = 0 WHERE id = ?", [book.id]);

                res.json({ message: 'Book issued successfully' });
            });
        });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});