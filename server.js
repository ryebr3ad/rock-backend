const express = require('express');
const cors = require('cors');
const app = express();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const dataPath = path.join(__dirname, process.env.DATA_FILE || 'count.txt');

app.use(cors());
app.use(express.json());

let rockCount = 0;
try {
    if (fs.existsSync(dataPath)) {
	const data = fs.readFileSync(dataPath, 'utf8');
	rockCount = parseInt(data) || 0;
	console.log(`Loaded existing rock count: ${rockCount}`);
    }
} catch (err) {
    console.error(`Error reading count file: ${err}`);
}

const validateKey = (req, res, next) => {
    const userKey = req.headers('x-api-key');
    if(userKey === process.env.API_SECRET_KEY) {
	next();
    }
    else {
	res.status(403).json({error: 'Forbidden: Invalid API Key" '});
    }
}

app.get('/status', validateKey, (req, res) => {
    res.json({message: `${rockCount} total rock${rockCount === 1 ? '' : 's'} produced`});
});

app.post('/add-rock', validateKey, (req, res) => {
    rockCount++;

    fs.writeFile(dataPath, rockCount.toString(), (err) => {
	if (err) console.error(`Could not save to file:${err}`);
    });

    res.json({success: true, total: rockCount});
});

app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
});
