const nodemailer = require('nodemailer');

// ── Transporter Setup ─────────────────────────────────────────────────────────

/**
 * Creates a Nodemailer transporter using Gmail with an App Password.
 * To use this:
 *  1. Enable 2-Factor Authentication on your Google account.
 *  2. Generate an App Password at: https://myaccount.google.com/apppasswords
 *  3. Set EMAIL_FROM and EMAIL_PASS in your .env file.
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_FROM,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── Email Templates ───────────────────────────────────────────────────────────

/**
 * Generates the HTML body for the task-created confirmation email.
 */
const taskCreatedTemplate = (userName, task) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 32px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; }
    .greeting { color: #1e293b; font-size: 16px; margin-bottom: 20px; }
    .task-card { background: #f8faff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .task-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .task-desc { color: #64748b; font-size: 14px; margin: 0 0 16px; }
    .pill { display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; margin-right: 6px; }
    .status-pending { background: #fef3c7; color: #b45309; }
    .priority-high { background: #fee2e2; color: #b91c1c; }
    .priority-medium { background: #fef3c7; color: #b45309; }
    .priority-low { background: #dcfce7; color: #15803d; }
    .detail-row { display: flex; gap: 8px; margin-top: 12px; font-size: 13px; color: #475569; }
    .footer { padding: 20px 40px; background: #f8faff; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Task Created!</h1>
      <p>Task Manager — Your productivity hub</p>
    </div>
    <div class="body">
      <p class="greeting">Hi <strong>${userName}</strong>,</p>
      <p style="color: #475569; font-size: 15px;">Your new task has been created and is ready to go. Here's a summary:</p>
      <div class="task-card">
        <p class="task-title">${task.title}</p>
        ${task.description ? `<p class="task-desc">${task.description}</p>` : ''}
        <div>
          <span class="pill status-pending">${task.status}</span>
          <span class="pill priority-${task.priority.toLowerCase()}">${task.priority} Priority</span>
        </div>
        <div class="detail-row">
          ${task.dueDate ? `<span>📅 Due: <strong>${new Date(task.dueDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}</strong></span>` : ''}
          ${task.location ? `<span>📍 ${task.location}</span>` : ''}
        </div>
      </div>
      <p style="color: #64748b; font-size: 14px;">Good luck! Log in to your dashboard to track progress.</p>
    </div>
    <div class="footer">
      You received this because you created a task on Task Manager. &copy; ${new Date().getFullYear()} Task Manager.
    </div>
  </div>
</body>
</html>
`;

/**
 * Generates the HTML body for the task-completed notification email.
 */
const taskCompletedTemplate = (userName, task) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6fb; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 32px 40px; }
    .header h1 { color: #fff; margin: 0; font-size: 22px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.8); margin: 6px 0 0; font-size: 14px; }
    .body { padding: 32px 40px; }
    .task-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .task-title { font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
    .badge { display: inline-block; background: #dcfce7; color: #15803d; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 700; }
    .footer { padding: 20px 40px; background: #f8faff; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Task Completed!</h1>
      <p>Task Manager — Great work, keep it up!</p>
    </div>
    <div class="body">
      <p style="color: #1e293b; font-size: 16px;">Hi <strong>${userName}</strong>,</p>
      <p style="color: #475569; font-size: 15px;">Congratulations on completing your task! Every done task is a step forward. 🚀</p>
      <div class="task-card">
        <p class="task-title">${task.title}</p>
        <span class="badge">✓ DONE</span>
        ${task.location ? `<p style="color: #64748b; font-size: 13px; margin-top: 12px;">📍 ${task.location}</p>` : ''}
      </div>
      <p style="color: #64748b; font-size: 14px;">Keep the momentum going — check your dashboard for what's next.</p>
    </div>
    <div class="footer">
      You received this because a task was marked complete on Task Manager. &copy; ${new Date().getFullYear()} Task Manager.
    </div>
  </div>
</body>
</html>
`;

// ── Exported Functions ────────────────────────────────────────────────────────

/**
 * Sends a confirmation email when a task is created.
 */
const sendTaskCreatedEmail = async (userEmail, userName, task) => {
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — skipping task creation email');
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Task Manager" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: `✅ Task Created: ${task.title}`,
    html: taskCreatedTemplate(userName, task),
  });

  console.log(`📧 Task creation email sent to ${userEmail}`);
};

/**
 * Sends a notification email when a task is marked as DONE.
 */
const sendTaskCompletedEmail = async (userEmail, userName, task) => {
  if (!process.env.EMAIL_FROM || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — skipping task completion email');
    return;
  }

  const transporter = createTransporter();

  await transporter.sendMail({
    from: `"Task Manager" <${process.env.EMAIL_FROM}>`,
    to: userEmail,
    subject: `🎉 Task Completed: ${task.title}`,
    html: taskCompletedTemplate(userName, task),
  });

  console.log(`📧 Task completion email sent to ${userEmail}`);
};

module.exports = { sendTaskCreatedEmail, sendTaskCompletedEmail };
