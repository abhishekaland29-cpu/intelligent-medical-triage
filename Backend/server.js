const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- KEY FIX: Serve your frontend files ---
// This tells the server to look for your .html, .css, and .js files in the current folder
app.use(express.static(__dirname));

// 1. Initialize Gemini AI (Secure)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 2. Database Connection (Cloud-Ready)
const db = mysql.createConnection({
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '',
    port: process.env.DB_PORT || 3306,
    // Required for most Cloud DBs like TiDB or Aiven
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
});

db.connect((err) => {
    if (err) {
        console.error('MySQL Connection Error:', err.message);
        return;
    }
    console.log('Successfully connected to the MySQL Database!');
});

// 3. Keyword-Based Triage Logic
function calculatePriority(symptoms, painLevel) {
    const text = symptoms.toLowerCase();
    const pain = parseInt(painLevel);

    const criticalWords = ['chest pain', 'breathing', 'unconscious', 'bleeding', 'stroke', 'seizure', 'heart', 'head injury'];
    const urgentWords = ['fever', 'fracture', 'broken', 'vomiting', 'dehydration', 'severe', 'infection', 'stomach pain'];

    if (criticalWords.some(word => text.includes(word)) || pain >= 9) {
        return { priority: 1, reason: "Detected critical symptoms or extreme pain level." };
    }
    if (urgentWords.some(word => text.includes(word)) || pain >= 6) {
        return { priority: 2, reason: "Detected urgent symptoms or moderate-high pain." };
    }
    return { priority: 3, reason: "Symptoms and pain levels indicate a stable condition." };
}

// 4. Routes
app.post('/api/triage', (req, res) => {
    const { name, symptoms, painLevel } = req.body;
    const decision = calculatePriority(symptoms, painLevel);
    const sql = "INSERT INTO triage_queue (name, symptoms, pain_level, priority, ai_reason, status) VALUES (?, ?, ?, ?, ?, 'Waiting')";
    
    db.query(sql, [name, symptoms, painLevel, decision.priority, decision.reason], (err, result) => {
        if (err) return res.status(500).json({ error: "Database failure" });
        res.json({ success: true, ai_decision: decision });
    });
});

app.get('/api/queue', (req, res) => {
    const sql = "SELECT * FROM triage_queue ORDER BY priority ASC, registration_time ASC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).send(err);
        res.json(results);
    });
});

app.put('/api/status/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const sql = "UPDATE triage_queue SET status = ? WHERE id = ?";
    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Status updated" });
    });
});

// 5. Start Server (Dynamic Port for Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});