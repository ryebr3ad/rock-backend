const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database(path.join(__dirname, 'rocks.db'));

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
    if(userKey === process.env.API_SECRET_KEY) {
	next();
    }
    else {
	res.status(403).json({error: 'Forbidden: Invalid API Key'});
    }
}

app.get('/status', validateKey, (req, res) => {
    res.json({message: `${rockCount} total rock${rockCount === 1 ? '' : 's'} produced`});
});

app.post('/add-rock', validateKey, (req, res) => {
    rockCount++;

    db.run("UPDATE stats SET value = ? WHERE key = 'global_count'", [rockCount], (err) => {
	if (err) console.error("DB Error:", err.message);
    });
    
    res.json({success: true, total: rockCount});
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
