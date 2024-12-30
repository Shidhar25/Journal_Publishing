import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Express
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Admin authentication middleware
const checkAdminAuth = (req, res, next) => {
    const { email, password } = req.body;
    console.log('Admin login attempt:', email);
    
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
        console.log('Admin login successful:', email);
        next();
    } else {
        console.log('Admin login failed:', email);
        res.status(401).json({ error: 'Invalid credentials' });
    }
};

// Admin login route
app.post('/api/admin/login', checkAdminAuth, (req, res) => {
    res.json({ success: true });
});

// Serve static files
app.use(express.static('Public'));
app.use('/node_modules', express.static('node_modules'));

// Protected admin routes
app.get('/admindashboard.html', (req, res) => {
    res.sendFile(join(__dirname, 'Public', 'admindashboard.html'));
});

// Main routes
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'Public', 'index.html'));
});

// Catch all route for SPA
app.get('*', (req, res) => {
    res.sendFile(join(__dirname, 'Public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    try {
        console.log('Starting server initialization...');
        
        // Start listening
        app.listen(port, () => {

            console.log(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();