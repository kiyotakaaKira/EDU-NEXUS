const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

async function sendEmail({ to, subject, html }) {
  try {
    await transporter.sendMail({
      from: `"CIT-Sentinel" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    return { success: true };
  } catch (err) {
    console.error('Email error:', err);
    return { success: false, error: err.message };
  }
}

async function sendParentAlert(studentName, studentId, attendance, mentorName) {
  return sendEmail({
    to: process.env.PARENT_EMAIL || process.env.EMAIL_USER,
    subject: `⚠️ CIT-Sentinel Alert: ${studentName} Needs Attention`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a6b; padding: 20px; text-align: center;">
          <h1 style="color: #FFD700; margin: 0;">🛡️ CIT-Sentinel</h1>
          <p style="color: #fff; margin: 5px 0;">Chennai Institute of Technology</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: #1a3a6b;">Academic Alert Notice</h2>
          <p>Dear Parent/Guardian,</p>
          <p>This is an automated alert from the CIT-Sentinel Academic Intelligence System regarding your ward:</p>
          <div style="background: #fff; border-left: 4px solid #FFD700; padding: 15px; margin: 20px 0;">
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Register No:</strong> ${studentId}</p>
            <p><strong>Current Attendance:</strong> <span style="color: red;">${attendance}%</span></p>
            <p><strong>Required Minimum:</strong> 75%</p>
            <p><strong>Assigned Mentor:</strong> ${mentorName}</p>
          </div>
          <p>Your ward's academic performance requires immediate attention. Please contact the mentor at your earliest convenience.</p>
          <p style="color: #666; font-size: 12px;">This is an automated message from CIT-Sentinel. Please do not reply to this email.</p>
        </div>
        <div style="background: #1a3a6b; padding: 15px; text-align: center;">
          <p style="color: #FFD700; margin: 0; font-size: 12px;">Chennai Institute of Technology — Transforming Lives</p>
        </div>
      </div>
    `
  });
}

async function sendEscalationEmail(studentName, studentId, hodName, issue, principalEmail) {
  return sendEmail({
    to: principalEmail || process.env.EMAIL_USER,
    subject: `🚨 CIT-Sentinel Escalation: ${studentName} — Immediate Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a6b; padding: 20px; text-align: center;">
          <h1 style="color: #FFD700; margin: 0;">🛡️ CIT-Sentinel</h1>
          <p style="color: #fff;">Escalation Notice — Principal's Office</p>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <h2 style="color: red;">🚨 Escalation Alert</h2>
          <p>Dear Principal,</p>
          <p>The following case has been escalated from HOD for immediate attention:</p>
          <div style="background: #fff; border-left: 4px solid red; padding: 15px; margin: 20px 0;">
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Register No:</strong> ${studentId}</p>
            <p><strong>Escalated By:</strong> ${hodName}</p>
            <p><strong>Issue:</strong> ${issue}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <p>Please review this case and take appropriate action through the Principal's dashboard.</p>
        </div>
        <div style="background: #1a3a6b; padding: 15px; text-align: center;">
          <p style="color: #FFD700; margin: 0; font-size: 12px;">CIT-Sentinel Academic Intelligence Platform</p>
        </div>
      </div>
    `
  });
}

async function sendInterventionEmail(studentName, mentorName, plan, studentEmail) {
  return sendEmail({
    to: studentEmail || process.env.EMAIL_USER,
    subject: `📋 Your Personalized Study Plan — CIT-Sentinel`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a6b; padding: 20px; text-align: center;">
          <h1 style="color: #FFD700; margin: 0;">🛡️ CIT-Sentinel</h1>
          <p style="color: #fff;">Your Academic Recovery Plan</p>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1a3a6b;">Hi ${studentName},</h2>
          <p>Your mentor <strong>${mentorName}</strong> has created a personalized 4-week recovery plan for you:</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <pre style="font-family: Arial; white-space: pre-wrap;">${plan}</pre>
          </div>
          <p>Log in to CIT-Sentinel to track your progress and chat with Sentinel AI for support.</p>
        </div>
      </div>
    `
  });
}

async function sendMeetingScheduleEmail(studentName, mentorName, date, time, studentEmail) {
  return sendEmail({
    to: studentEmail || process.env.EMAIL_USER,
    subject: `📅 Meeting Scheduled — ${date} at ${time}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a3a6b; padding: 20px; text-align: center;">
          <h1 style="color: #FFD700; margin: 0;">🛡️ CIT-Sentinel</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #1a3a6b;">Meeting Scheduled</h2>
          <p>Dear ${studentName},</p>
          <p>Your mentor <strong>${mentorName}</strong> has scheduled a meeting with you:</p>
          <div style="background: #f9f9f9; border-left: 4px solid #FFD700; padding: 15px; margin: 20px 0;">
            <p><strong>📅 Date:</strong> ${date}</p>
            <p><strong>⏰ Time:</strong> ${time}</p>
            <p><strong>👤 Mentor:</strong> ${mentorName}</p>
          </div>
          <p>Please be present on time. Contact your mentor if you need to reschedule.</p>
        </div>
      </div>
    `
  });
}

module.exports = { 
  sendParentAlert, 
  sendEscalationEmail, 
  sendInterventionEmail,
  sendMeetingScheduleEmail,
  sendEmail
};
