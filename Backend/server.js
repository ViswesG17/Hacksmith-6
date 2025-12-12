const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ⚠️ PASTE YOUR CONNECTION STRING HERE ⚠️
const mongoURI = "mongodb+srv://ViswesG:31606021@cluster0.y4ghrvc.mongodb.net/WaterQualityDB?retryWrites=true&w=majority";

mongoose.connect(mongoURI)
    .then(() => console.log("✅ CONNECTED TO MONGODB CLOUD"))
    .catch(err => console.log("❌ Cloud Error:", err));

// --- FINAL SCHEMA (NO GPS) ---
const WaterSchema = new mongoose.Schema({
    ph: Number,
    voltage: Number,
    turbidity: String,
    
    // Spectral & AI
    cdom: Number,
    algae: Number,
    plastic: Number,
    classification: String,
    confidence: Number,
    
    // Environment
    temperature: Number,
    
    distance: Number,
    status: String,
    timestamp: { type: Date, default: Date.now }
});

const WaterData = mongoose.model('WaterData', WaterSchema);

// API to Receive Data
app.post('/api/data', async (req, res) => {
    try {
        const newData = new WaterData(req.body);
        await newData.save();
        res.status(200).send("Saved");
    } catch (err) {
        console.error("Save Error:", err);
        res.status(500).send(err);
    }
});

// API to Show Data
app.get('/api/data', async (req, res) => {
    try {
        const data = await WaterData.find().sort({ timestamp: -1 }).limit(10);
        res.json(data);
    } catch (err) {
        res.status(500).send(err);
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on Port ${PORT}`));