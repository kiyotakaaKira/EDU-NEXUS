require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./models/User');
const Intervention = require('./models/Intervention');
const Alert = require('./models/Alert');
const { 
  sendParentAlert, 
  sendEscalationEmail, 
  sendInterventionEmail,
  sendMeetingScheduleEmail 
} = require('./utils/mailer');

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

// PARENT ALERT WITH REAL EMAIL
app.post('/api/alerts/parent', verifyToken, async (req, res) => {
  try {
    const { studentName, studentId, attendance, message } = req.body;
    
    const db_alert = await Alert.create({
      studentId,
      studentName,
      message: message || `Urgent: ${studentName} attendance is at ${attendance}%`,
      sentBy: req.user.name,
      type: 'Parent Alert'
    });

    const emailResult = await sendParentAlert(
      studentName,
      studentId, 
      attendance,
      req.user.name
    );

    res.json({ 
      success: true, 
      alert: db_alert,
      emailSent: emailResult.success,
      message: emailResult.success ? 'Alert saved and email sent to parent' : 'Alert saved but email failed'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send alert' });
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
        prompt: `You are Sentinel AI for Chennai Institute of Technology.

FORMATTING RULES:
- Bold key numbers using **bold**
- Use bullet points with → for lists
- Never write walls of text
- Break content into clear sections

LENGTH RULES:
- Simple greeting → 1-2 lines + question
- Single metric check → 3-4 lines + question
- Analysis request → structured sections
- Full report request → headers + bullets + summary

FORMATS:

Simple:
[1-2 line answer]
[question]

Data check:
**[Topic]**
→ [metric 1]
→ [metric 2]
[question]

Analysis:
**Assessment**
[2-3 sentences]

**Key Points**
→ [point 1]
→ [point 2]

**Next Step**
[one action]

[question]

RULES:
- End EVERY reply with ONE question
- Acknowledge feelings before advice for students
- Build on conversation history
- Never repeat same question twice

TONE:
- Student → warm, friendly, supportive senior
- Mentor/Teacher → direct, tactical
- HOD → professional, departmental
- Principal/Chairman → strategic, institutional

CONTEXT: ${systemPrompt}

User: ${userMessage}

Sentinel AI:`,
        stream: false,
        options: { temperature: 0.75, num_predict: 350 }
      })
    });
    const data = await response.json();
    res.json({ success: true, response: data.response });
  } catch {
    res.json({
      success: true,
      response: 'Sentinel AI is momentarily offline. Please try again.',
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
      body: JSON.stringify({
          model: 'llama3.2',
          prompt: `You are Sentinel AI for CIT. Structured formatting only. Bold key terms. Bullet points, no paragraphs.

**Student Profile**
→ Name: ${studentData.name}
→ Year: ${studentData.year} | Dept: ${studentData.department}
→ Attendance: ${studentData.attendance}%
→ IAT Total: ${studentData.iatTotal}/100
→ Status: ${studentData.status}
→ Pattern: ${studentData.persona}

Reply in this EXACT format:

**Dropout Risk**
[X]% — [one line reason]

**Root Causes**
→ [Cause 1]
→ [Cause 2]
→ [Cause 3]

**4-Week Rescue Plan**
→ Week 1: [action]
→ Week 2: [action]
→ Week 3: [action]
→ Week 4: [action]

**What NOT To Do**
→ [Mistake 1]
→ [Mistake 2]

**Mentor Opening Line**
"[Exact sentence to say to student]"`,
          stream: false,
          options: { temperature: 0.72, num_predict: 400 }
        })
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

// ESCALATION TO PRINCIPAL WITH EMAIL
app.post('/api/escalations', verifyToken, async (req, res) => {
  try {
    const { studentName, studentId, issue, priority } = req.body;
    
    const escalation = await Intervention.create({
      studentId,
      studentName,
      type: 'Escalation',
      note: issue,
      createdBy: req.user.name,
      createdByRole: req.user.role,
      status: 'Escalated'
    });

    const emailResult = await sendEscalationEmail(
      studentName,
      studentId,
      req.user.name,
      issue,
      process.env.PRINCIPAL_EMAIL
    );

    res.json({ 
      success: true, 
      escalation,
      emailSent: emailResult.success
    });
  } catch (err) {
    res.status(500).json({ error: 'Escalation failed' });
  }
});

// GET ESCALATIONS (Principal view)
app.get('/api/escalations', verifyToken, async (req, res) => {
  try {
    const escalations = await Intervention.find({ 
      type: 'Escalation' 
    }).sort({ createdAt: -1 });
    res.json(escalations);
  } catch {
    res.status(500).json({ error: 'Failed to fetch escalations' });
  }
});

// RESOLVE ESCALATION
app.patch('/api/escalations/:id/resolve', verifyToken, async (req, res) => {
  try {
    const escalation = await Intervention.findByIdAndUpdate(
      req.params.id,
      { status: 'Resolved' },
      { new: true }
    );
    res.json({ success: true, escalation });
  } catch {
    res.status(500).json({ error: 'Failed to resolve' });
  }
});

// ACKNOWLEDGE ESCALATION
app.patch('/api/escalations/:id/acknowledge', verifyToken, async (req, res) => {
  try {
    const escalation = await Intervention.findByIdAndUpdate(
      req.params.id,
      { status: 'Acknowledged' },
      { new: true }
    );
    res.json({ success: true, escalation });
  } catch {
    res.status(500).json({ error: 'Failed to acknowledge' });
  }
});

// SCHEDULE MEETING WITH EMAIL
app.post('/api/meetings', verifyToken, async (req, res) => {
  try {
    const { studentName, studentId, date, time, studentEmail } = req.body;
    
    const meeting = await Intervention.create({
      studentId,
      studentName,
      type: 'Meeting Scheduled',
      note: `Meeting on ${date} at ${time}`,
      createdBy: req.user.name,
      createdByRole: req.user.role,
      status: 'Active'
    });

    const emailResult = await sendMeetingScheduleEmail(
      studentName,
      req.user.name,
      date,
      time,
      studentEmail
    );

    res.json({ 
      success: true, 
      meeting,
      emailSent: emailResult.success
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to schedule meeting' });
  }
});

// SEND INTERVENTION PLAN WITH EMAIL
app.post('/api/interventions/send-plan', verifyToken, async (req, res) => {
  try {
    const { studentName, studentId, plan, studentEmail } = req.body;
    
    const intervention = await Intervention.create({
      studentId,
      studentName,
      type: 'AI Intervention Plan',
      note: plan,
      createdBy: req.user.name,
      status: 'Active'
    });

    const emailResult = await sendInterventionEmail(
      studentName,
      req.user.name,
      plan,
      studentEmail
    );

    res.json({ 
      success: true, 
      intervention,
      emailSent: emailResult.success
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send plan' });
  }
});

// REPORT GENERATION
app.post('/api/reports/generate', verifyToken, async (req, res) => {
  try {
    const { reportType, department } = req.body;
    
    const reportData = {
      id: Date.now(),
      type: reportType,
      department: department || req.user.department,
      generatedBy: req.user.name,
      generatedAt: new Date().toISOString(),
      downloadUrl: `/api/reports/download/${Date.now()}`
    };

    res.json({ success: true, report: reportData });
  } catch {
    res.status(500).json({ error: 'Report generation failed' });
  }
});

// NOTIFICATION ROUTES
app.get('/api/notifications', verifyToken, async (req, res) => {
  const notificationsByRole = {
    Student: [
      { id: 1, message: 'Your attendance has dropped below 75%', read: false, type: 'warning', time: '2 hours ago' },
      { id: 2, message: 'IAT 2 scheduled for Week 8 — 2 weeks away', read: false, type: 'info', time: '1 day ago' },
      { id: 3, message: 'New concept video recommended for you', read: true, type: 'info', time: '2 days ago' }
    ],
    'Subject Teacher': [
      { id: 1, message: 'Mark entry deadline is tomorrow', read: false, type: 'warning', time: '3 hours ago' },
      { id: 2, message: '3 students have been referred to mentor', read: false, type: 'info', time: '1 day ago' },
      { id: 3, message: 'Class attendance report ready', read: true, type: 'success', time: '3 days ago' }
    ],
    Mentor: [
      { id: 1, message: '3 mentees need urgent intervention', read: false, type: 'critical', time: '1 hour ago' },
      { id: 2, message: 'Peer bridge match available for Arun Kumar', read: false, type: 'info', time: '5 hours ago' },
      { id: 3, message: 'New escalation received from HOD', read: false, type: 'warning', time: '1 day ago' }
    ],
    HOD: [
      { id: 1, message: '5 students at critical risk this week', read: false, type: 'critical', time: '30 mins ago' },
      { id: 2, message: 'Weekly retention report is ready', read: false, type: 'success', time: '2 hours ago' },
      { id: 3, message: '2 interventions are overdue', read: false, type: 'warning', time: '1 day ago' }
    ],
    Principal: [
      { id: 1, message: 'Monthly institution report available', read: false, type: 'info', time: '1 hour ago' },
      { id: 2, message: 'New escalation from AI & DS department', read: false, type: 'critical', time: '3 hours ago' },
      { id: 3, message: 'Retention rate updated — 94.2%', read: false, type: 'success', time: '1 day ago' }
    ],
    Chairman: [
      { id: 1, message: 'Semester IV retention report ready', read: false, type: 'success', time: '2 hours ago' },
      { id: 2, message: 'SDG 4 impact metrics updated', read: false, type: 'info', time: '1 day ago' },
      { id: 3, message: 'Industry readiness cohort expanded to 34 students', read: false, type: 'success', time: '2 days ago' }
    ]
  };

  const notifications = notificationsByRole[req.user.role] || [];
  res.json(notifications);
});

app.listen(PORT, () => {
  console.log('\n CIT-Sentinel Backend Running');
  console.log(' API: http://localhost:' + PORT);
  console.log(' DB:  MongoDB Atlas');
  console.log(' AI:  Ollama :11434\n');
});
