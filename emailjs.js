/* ═══════════════════════════════════════════════════════
   BriskLearn — EmailJS Integration
   Real email notifications for:
   - Faculty credentials on approval
   - Password reset links
   - Approval/rejection notifications
   - Quiz results to students

   SETUP: Replace SERVICE_ID, TEMPLATE IDs with your EmailJS values
   Sign up free at https://www.emailjs.com
   ═══════════════════════════════════════════════════════ */

window.EmailService = (() => {

  // ─── CONFIGURATION ───────────────────────────────────────
  // Replace these with your actual EmailJS credentials
  const CONFIG = {
    PUBLIC_KEY:  'YOUR_EMAILJS_PUBLIC_KEY',   // EmailJS Public Key
    SERVICE_ID:  'YOUR_SERVICE_ID',           // e.g. 'service_gmail'
    TEMPLATES: {
      FACULTY_WELCOME:  'template_faculty_welcome',
      PASSWORD_RESET:   'template_password_reset',
      ACCOUNT_APPROVED: 'template_account_approved',
      ACCOUNT_REJECTED: 'template_account_rejected',
      QUIZ_RESULT:      'template_quiz_result',
      ANNOUNCEMENT:     'template_announcement',
    }
  };
  // ─────────────────────────────────────────────────────────

  let initialized = false;

  function init() {
    if (CONFIG.PUBLIC_KEY === 'YOUR_EMAILJS_PUBLIC_KEY') {
      console.warn('[EmailJS] Not configured. Using demo mode (emails logged only).');
      return;
    }
    emailjs.init({ publicKey: CONFIG.PUBLIC_KEY });
    initialized = true;
    console.info('[EmailJS] Initialized.');
  }

  async function send(templateId, params) {
    if (!initialized) {
      // Demo mode — log instead of sending
      console.info('[EmailJS DEMO] Would send:', templateId, params);
      toast('📧 Email queued (configure EmailJS to send real emails)', 'info');
      return { status: 200, text: 'demo' };
    }
    try {
      const res = await emailjs.send(CONFIG.SERVICE_ID, templateId, params);
      return res;
    } catch (err) {
      console.error('[EmailJS Error]', err);
      throw new Error('Failed to send email: ' + (err.text || err.message));
    }
  }

  // ─── Email Templates ─────────────────────────────────────

  /**
   * Send welcome email with credentials when faculty is approved
   */
  async function sendFacultyWelcome({ name, email, password, institution }) {
    return send(CONFIG.TEMPLATES.FACULTY_WELCOME, {
      to_name: name,
      to_email: email,
      temp_password: password,
      institution,
      login_url: window.location.origin,
      subject: `Welcome to BriskLearn — Your Faculty Account is Ready`,
    });
  }

  /**
   * Send password reset email with temporary password
   */
  async function sendPasswordReset({ name, email, tempPassword }) {
    return send(CONFIG.TEMPLATES.PASSWORD_RESET, {
      to_name: name,
      to_email: email,
      temp_password: tempPassword,
      login_url: window.location.origin,
      subject: `BriskLearn — Password Reset`,
    });
  }

  /**
   * Notify faculty their account was approved
   */
  async function sendApprovalNotification({ name, email, role }) {
    return send(CONFIG.TEMPLATES.ACCOUNT_APPROVED, {
      to_name: name,
      to_email: email,
      role,
      login_url: window.location.origin,
      subject: `BriskLearn — Your Account Has Been Approved`,
    });
  }

  /**
   * Notify faculty their account was rejected
   */
  async function sendRejectionNotification({ name, email, reason }) {
    return send(CONFIG.TEMPLATES.ACCOUNT_REJECTED, {
      to_name: name,
      to_email: email,
      reason: reason || 'Please contact the administrator for more information.',
      subject: `BriskLearn — Account Application Update`,
    });
  }

  /**
   * Send quiz result to student
   */
  async function sendQuizResult({ studentName, studentEmail, quizTitle, score, total, percentage }) {
    return send(CONFIG.TEMPLATES.QUIZ_RESULT, {
      to_name: studentName,
      to_email: studentEmail,
      quiz_title: quizTitle,
      score,
      total,
      percentage: percentage.toFixed(1),
      grade: getLetterGrade(percentage),
      subject: `BriskLearn — Your Quiz Result: ${quizTitle}`,
    });
  }

  /**
   * Send class-wide announcement
   */
  async function sendAnnouncement({ facultyName, recipientEmails, message, className }) {
    const promises = recipientEmails.map(email =>
      send(CONFIG.TEMPLATES.ANNOUNCEMENT, {
        to_email: email,
        faculty_name: facultyName,
        class_name: className,
        message,
        subject: `BriskLearn — Announcement from ${facultyName}`,
      })
    );
    return Promise.allSettled(promises);
  }

  function getLetterGrade(pct) {
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    return 'F';
  }

  return {
    init,
    sendFacultyWelcome,
    sendPasswordReset,
    sendApprovalNotification,
    sendRejectionNotification,
    sendQuizResult,
    sendAnnouncement,
    CONFIG
  };
})();
