require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const Intervention = require('./models/Intervention');
const Alert = require('./models/Alert');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cit-sentinel-secret-2025';
const MONGODB_URI = process.env.MONGODB_URI;

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB Atlas connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('192.168.') || origin.includes('10.') || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'CIT-Sentinel Backend Running',
    version: '2.0',
    database: mongoose.connection.readyState === 1 ? 'MongoDB Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) return res.status(400).json({ error: 'Missing credentials' });
  try {
    const user = await User.findOne({ userId });
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { id: user._id, userId: user.userId, name: user.name, role: user.role, department: user.department, studentId: user.studentId },
      JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      token,
      user: { userId: user.userId, name: user.name, role: user.role, department: user.department, studentId: user.studentId }
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// VERIFY TOKEN
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// LOGOUT
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

// SAVE INTERVENTION
app.post('/api/interventions', verifyToken, async (req, res) => {
  try {
    const intervention = await Intervention.create({
      studentId: req.body.studentId,
      studentName: req.body.studentName,
      type: req.body.type,
      note: req.body.note,
      createdBy: req.user.name,
      createdByRole: req.user.role
    });
    res.json({ success: true, intervention });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save intervention' });
  }
});

// GET INTERVENTIONS
app.get('/api/interventions', verifyToken, async (req, res) => {
  try {
    const interventions = await Intervention.find().sort({ createdAt: -1 });
    res.json(interventions);
  } catch {
    res.status(500).json({ error: 'Failed to fetch interventions' });
  }
});

// PARENT ALERT
app.post('/api/alerts/parent', verifyToken, async (req, res) => {
  try {
    const alert = await Alert.create({
      studentId: req.body.studentId,
      studentName: req.body.studentName,
      message: req.body.message,
      sentBy: req.user.name
    });
    res.json({ success: true, alert });
  } catch {
    res.status(500).json({ error: 'Failed to save alert' });
  }
});

// AI CHAT via Ollama
app.post('/api/ai/chat', verifyToken, async (req, res) => {
  const { systemPrompt, userMessage } = req.body;
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt: systemPrompt + '\n\nUser: ' + userMessage + '\n\nAssistant:',
        stream: false,
        options: { temperature: 0.7, num_predict: 300 }
      })
    });
    const data = await response.json();
    res.json({ success: true, response: data.response });
  } catch {
    res.json({
      success: true,
      response: 'Based on your academic profile, I recommend focusing on attendance recovery and scheduling a mentor meeting this week.',
      fallback: true
    });
  }
});

// AI DROPOUT ANALYSIS
app.post('/api/ai/dropout-analysis', verifyToken, async (req, res) => {
  const { studentData } = req.body;
  const prompt = `You are Sentinel AI for Chennai Institute of Technology.
Analyze dropout risk for:
Name: ${studentData.name}, Year: ${studentData.year}, Dept: ${studentData.department}
Attendance: ${studentData.attendance}%, IAT Total: ${studentData.iatTotal}/100
Status: ${studentData.status}, Pattern: ${studentData.persona}
Provide: 1) Dropout probability % 2) Top 3 root causes 3) 4-week rescue plan 4) What NOT to do 5) Mentor opening line. Under 300 words.`;
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3.2', prompt, stream: false, options: { temperature: 0.7, num_predict: 500 } })
    });
    const data = await response.json();
    res.json({ success: true, analysis: data.response });
  } catch {
    res.json({
      success: true,
      analysis: `Dropout Risk for ${studentData.name}:\nStatus: ${studentData.status}\nAttendance: ${studentData.attendance}%\nImmediate mentor intervention required.`,
      fallback: true
    });
  }
});

app.listen(PORT, () => {
  console.log('\n CIT-Sentinel Backend Running');
  console.log(' API: http://localhost:' + PORT);
  console.log(' DB:  MongoDB Atlas');
  console.log(' AI:  Ollama :11434\n');
});
