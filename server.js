const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const sqlite = require('sqlite3').verbose();
const http = require('http');

const db = new sqlite.Database(path.join(__dirname, 'rocks.db'));
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
    path: '/api/socket.io',
    cors: {
        origin: "https://ryes.rocks",
        methods: ['GET', 'POST']
    }
});

require('dotenv').config();

const PORT = process.env.PORT || 3000;
const dataPath = path.join(__dirname, process.env.DATA_FILE || 'count.txt');

app.use(cors());
app.use(express.json());

let rockCount = 0;

db.get("SELECT value FROM stats WHERE key = 'global_count'", (err, row) => {
    if (row) rockCount = row.value;
})

const validateKey = (req, res, next) => {
    const userKey = req.headers['x-api-key'];
    if (userKey === process.env.API_SECRET_KEY) {
        next();
    }
    else {
        res.status(403).json({ error: 'Forbidden: Invalid API Key' });
    }
}

app.get('/status', validateKey, (req, res) => {
    res.json({ message: `${rockCount} total rock${rockCount === 1 ? '' : 's'} produced` });
});

app.post('/add-rock', validateKey, (req, res) => {

    const sql = "UPDATE stats SET value = value + 1 WHERE key = 'global_count' RETURNING value"

    db.get(sql, [], (err, row) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        console.log(`rock added at ${new Date().toString()}`);
        io.emit('rock made');
        rockCount = row.value;
    });

    res.json({ success: true, total: rockCount });
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
