// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');

const app = express();
const server = http.createServer(app);

// Get PORT from environment or default to 3000
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'session-secret-change-in-production';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`;

// Configure Socket.IO with CORS
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});

// Middleware
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Session middleware (required for Passport)
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Database configuration - Auto-detect environment
const DATABASE_URL = process.env.DATABASE_URL;
const USE_POSTGRES = DATABASE_URL && (DATABASE_URL.startsWith('postgres://') || DATABASE_URL.startsWith('postgresql://'));
const USE_MYSQL = DATABASE_URL && DATABASE_URL.startsWith('mysql://');

let db;

// Database helper functions (must be defined before initializeDatabase is called)
const dbQuery = (query, params = []) => {
    return new Promise((resolve, reject) => {
        if (USE_POSTGRES) {
            db.query(query, params, (err, result) => {
                if (err) reject(err);
                else resolve(result.rows);
            });
        } else if (USE_MYSQL) {
            db.query(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results);
            });
        } else {
            db.all(query, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        }
    });
};

const dbRun = (query, params = []) => {
    return new Promise((resolve, reject) => {
        if (USE_POSTGRES) {
            db.query(query, params, (err, result) => {
                if (err) reject(err);
                else resolve({ insertId: result.rows[0]?.id, affectedRows: result.rowCount });
            });
        } else if (USE_MYSQL) {
            db.query(query, params, (err, result) => {
                if (err) reject(err);
                else resolve({ insertId: result.insertId, affectedRows: result.affectedRows });
            });
        } else {
            db.run(query, params, function (err) {
                if (err) reject(err);
                else resolve({ lastID: this.lastID, changes: this.changes });
            });
        }
    });
};

const dbGet = (query, params = []) => {
    return new Promise((resolve, reject) => {
        if (USE_POSTGRES) {
            db.query(query, params, (err, result) => {
                if (err) reject(err);
                else resolve(result.rows[0]);
            });
        } else if (USE_MYSQL) {
            db.query(query, params, (err, results) => {
                if (err) reject(err);
                else resolve(results[0]);
            });
        } else {
            db.get(query, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        }
    });
};

if (USE_POSTGRES) {
    // PostgreSQL for production (Railway, Heroku, etc.)
    const { Pool } = require('pg');
    db = new Pool({
        connectionString: DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    console.log('Using PostgreSQL database');
    initializeDatabase();
} else if (USE_MYSQL) {
    // MySQL for production (PlanetScale or other MySQL provider)
    const mysql = require('mysql2');
    db = mysql.createPool({
        uri: DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
    console.log('Using MySQL database');
    initializeDatabase();
} else {
    // SQLite for local development
    const sqlite3 = require('sqlite3').verbose();
    db = new sqlite3.Database('./database.db', (err) => {
        if (err) {
            console.error('Error opening database:', err);
        } else {
            console.log('Using SQLite database');
            initializeDatabase();
        }
    });
}

// Initialize database schema and seed data
async function initializeDatabase() {
    try {
        if (USE_POSTGRES) {
            // PostgreSQL schema
            await dbRun(`
                CREATE TABLE IF NOT EXISTS staff (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    google_id VARCHAR(255) UNIQUE,
                    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'staff')),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await dbRun(`
                CREATE TABLE IF NOT EXISTS schedules (
                    id SERIAL PRIMARY KEY,
                    staff_id INTEGER NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    date VARCHAR(50) NOT NULL,
                    start_time VARCHAR(50) NOT NULL,
                    end_time VARCHAR(50) NOT NULL,
                    location VARCHAR(255),
                    status VARCHAR(50) NOT NULL CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
                )
            `);
        } else if (USE_MYSQL) {
            // MySQL schema
            await dbRun(`
                CREATE TABLE IF NOT EXISTS staff (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password_hash VARCHAR(255),
                    google_id VARCHAR(255) UNIQUE,
                    role VARCHAR(50) NOT NULL CHECK(role IN ('admin', 'staff')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await dbRun(`
                CREATE TABLE IF NOT EXISTS schedules (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    staff_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    description TEXT,
                    date VARCHAR(50) NOT NULL,
                    start_time VARCHAR(50) NOT NULL,
                    end_time VARCHAR(50) NOT NULL,
                    location VARCHAR(255),
                    status VARCHAR(50) NOT NULL CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
                )
            `);
        } else {
            // SQLite schema
            await dbRun(`
                CREATE TABLE IF NOT EXISTS staff (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT,
                    google_id TEXT UNIQUE,
                    role TEXT NOT NULL CHECK(role IN ('admin', 'staff')),
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await dbRun(`
                CREATE TABLE IF NOT EXISTS schedules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    staff_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT,
                    date TEXT NOT NULL,
                    start_time TEXT NOT NULL,
                    end_time TEXT NOT NULL,
                    location TEXT,
                    status TEXT NOT NULL CHECK(status IN ('scheduled', 'completed', 'cancelled')) DEFAULT 'scheduled',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
                )
            `);
        }

        // Check if we need to seed data
        const result = await dbGet(USE_POSTGRES ? 'SELECT COUNT(*) as count FROM staff' : 'SELECT COUNT(*) as count FROM staff');
        if (result.count === 0) {
            await seedDatabase();
        }
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// Seed initial data
async function seedDatabase() {
    try {
        const adminPassword = await bcrypt.hash('admin123', 10);
        const staffPassword = await bcrypt.hash('staff123', 10);

        // Insert admin user
        if (USE_POSTGRES) {
            await dbRun(
                'INSERT INTO staff (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
                ['Admin User', 'admin@schedule.com', adminPassword, 'admin']
            );
        } else {
            await dbRun(
                'INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@schedule.com', adminPassword, 'admin']
            );
        }

        // Insert John Doe
        const johnResult = await dbRun(
            USE_POSTGRES
                ? 'INSERT INTO staff (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id'
                : 'INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['John Doe', 'john@schedule.com', staffPassword, 'staff']
        );
        const johnId = USE_POSTGRES ? johnResult.insertId : (USE_MYSQL ? johnResult.insertId : johnResult.lastID);

        // Add sample schedules for John
        await dbRun(
            USE_POSTGRES
                ? 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
                : 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [johnId, 'Morning Shift', 'Front desk duty', '2025-12-06', '08:00', '16:00', 'Main Office', 'scheduled']
        );
        await dbRun(
            USE_POSTGRES
                ? 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
                : 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [johnId, 'Safety Training', 'Annual safety certification', '2025-12-08', '10:00', '12:00', 'Training Room B', 'scheduled']
        );

        // Insert Jane Smith
        const janeResult = await dbRun(
            USE_POSTGRES
                ? 'INSERT INTO staff (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id'
                : 'INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
            ['Jane Smith', 'jane@schedule.com', staffPassword, 'staff']
        );
        const janeId = USE_POSTGRES ? janeResult.insertId : (USE_MYSQL ? janeResult.insertId : janeResult.lastID);

        // Add sample schedules for Jane
        await dbRun(
            USE_POSTGRES
                ? 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
                : 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [janeId, 'Delivery Route A', 'North district deliveries', '2025-12-06', '09:00', '17:00', 'Warehouse', 'scheduled']
        );
        await dbRun(
            USE_POSTGRES
                ? 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)'
                : 'INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [janeId, 'Evening Shift', 'Customer service', '2025-12-07', '16:00', '00:00', 'Main Office', 'scheduled']
        );

        console.log('Database seeded with initial data');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

// Admin-only middleware
function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

// ==================== PASSPORT CONFIGURATION ====================

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await dbGet(
            USE_POSTGRES ? 'SELECT id, name, email, role FROM staff WHERE id = $1' : 'SELECT id, name, email, role FROM staff WHERE id = ?',
            [id]
        );
        done(null, user);
    } catch (err) {
        done(err);
    }
});

// Configure Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: CALLBACK_URL
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const googleId = profile.id;
                const email = profile.emails[0].value;
                const name = profile.displayName;

                // Check if user exists by Google ID
                const userByGoogleId = await dbGet(
                    USE_POSTGRES ? 'SELECT * FROM staff WHERE google_id = $1' : 'SELECT * FROM staff WHERE google_id = ?',
                    [googleId]
                );

                if (userByGoogleId) {
                    return done(null, userByGoogleId);
                }

                // Check if user exists by email
                const existingUser = await dbGet(
                    USE_POSTGRES ? 'SELECT * FROM staff WHERE email = $1' : 'SELECT * FROM staff WHERE email = ?',
                    [email]
                );

                if (existingUser) {
                    // Link Google ID to existing account
                    await dbRun(
                        USE_POSTGRES ? 'UPDATE staff SET google_id = $1 WHERE id = $2' : 'UPDATE staff SET google_id = ? WHERE id = ?',
                        [googleId, existingUser.id]
                    );
                    existingUser.google_id = googleId;
                    return done(null, existingUser);
                }

                // Create new user
                const result = await dbRun(
                    USE_POSTGRES
                        ? 'INSERT INTO staff (name, email, google_id, role) VALUES ($1, $2, $3, $4) RETURNING id'
                        : 'INSERT INTO staff (name, email, google_id, role) VALUES (?, ?, ?, ?)',
                    [name, email, googleId, 'staff']
                );
                const newUserId = USE_POSTGRES ? result.rows[0].id : result.lastID;
                const newUser = {
                    id: newUserId,
                    name,
                    email,
                    google_id: googleId,
                    role: 'staff'
                };
                return done(null, newUser);
            } catch (error) {
                return done(error);
            }
        }));
} else {
    console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.');
}

// ==================== AUTH ROUTES ====================

// Google OAuth - Initiate authentication
app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

// Google OAuth - Callback
app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    (req, res) => {
        // Successful authentication
        const token = jwt.sign(
            { id: req.user.id, email: req.user.email, role: req.user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirect to frontend with token
        res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify({
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role
        }))}`);
    }
);

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    try {
        const user = await dbGet(
            USE_POSTGRES ? 'SELECT * FROM staff WHERE email = $1' : 'SELECT * FROM staff WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Database error' });
    }
});

// ==================== SCHEDULE ROUTES ====================

// Get logged-in staff's schedules
app.get('/api/schedules/my-schedules', authenticateToken, (req, res) => {
    const query = `
    SELECT s.*, st.name as staff_name, st.email as staff_email
    FROM schedules s
    JOIN staff st ON s.staff_id = st.id
    WHERE s.staff_id = ?
    ORDER BY s.date ASC, s.start_time ASC
  `;

    db.all(query, [req.user.id], (err, schedules) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(schedules);
    });
});

// Get all schedules (admin only)
app.get('/api/schedules/all', authenticateToken, requireAdmin, (req, res) => {
    const query = `
    SELECT s.*, st.name as staff_name, st.email as staff_email
    FROM schedules s
    JOIN staff st ON s.staff_id = st.id
    ORDER BY s.date ASC, s.start_time ASC
  `;

    db.all(query, [], (err, schedules) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(schedules);
    });
});

// Create new schedule (admin only)
app.post('/api/schedules', authenticateToken, requireAdmin, (req, res) => {
    const { staff_id, title, description, date, start_time, end_time, location, status } = req.body;

    if (!staff_id || !title || !date || !start_time || !end_time) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const query = `
    INSERT INTO schedules (staff_id, title, description, date, start_time, end_time, location, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    db.run(
        query,
        [staff_id, title, description || '', date, start_time, end_time, location || '', status || 'scheduled'],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            const scheduleId = this.lastID;
            io.emit('schedule:created', { id: scheduleId });
            res.json({ id: scheduleId, message: 'Schedule created successfully' });
        }
    );
});

// Update schedule (admin only)
app.put('/api/schedules/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;
    const { staff_id, title, description, date, start_time, end_time, location, status } = req.body;

    const query = `
    UPDATE schedules
    SET staff_id = ?, title = ?, description = ?, date = ?, start_time = ?, end_time = ?, location = ?, status = ?
    WHERE id = ?
  `;

    db.run(
        query,
        [staff_id, title, description, date, start_time, end_time, location, status, id],
        function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'Schedule not found' });
            }
            io.emit('schedule:updated', { id: parseInt(id) });
            res.json({ message: 'Schedule updated successfully' });
        }
    );
});

// Delete schedule (admin only)
app.delete('/api/schedules/:id', authenticateToken, requireAdmin, (req, res) => {
    const { id } = req.params;

    db.run('DELETE FROM schedules WHERE id = ?', [id], function (err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Schedule not found' });
        }
        io.emit('schedule:deleted', { id: parseInt(id) });
        res.json({ message: 'Schedule deleted successfully' });
    });
});

// ==================== STAFF ROUTES ====================

// Get all staff members (admin only)
app.get('/api/staff', authenticateToken, requireAdmin, (req, res) => {
    db.all('SELECT id, name, email, role, created_at FROM staff', [], (err, staff) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(staff);
    });
});

// Add new staff member (admin only)
app.post('/api/staff', authenticateToken, requireAdmin, async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['admin', 'staff'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const password_hash = await bcrypt.hash(password, 10);

    db.run(
        'INSERT INTO staff (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, password_hash, role],
        function (err) {
            if (err) {
                if (err.message.includes('UNIQUE')) {
                    return res.status(400).json({ error: 'Email already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            const staffId = this.lastID;
            io.emit('staff:created', { id: staffId });
            res.json({ id: staffId, message: 'Staff member added successfully' });
        }
    );
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('WebSocket server ready');
});
