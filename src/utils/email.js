import nodemailer from 'nodemailer';

let transporterCache = null;

/**
 * Gets or creates the nodemailer transporter (caching it if it's Ethereal)
 */
const getTransporter = async () => {
  if (transporterCache) {
    return transporterCache;
  }

  // 1. Check if SMTP configuration is provided in env
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // 2. Fallback to automated Ethereal Email test account (if not configured)
  console.log('🔄 Creating a temporary Ethereal test email account...');
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log(`✉️ Ethereal Test Account generated:`);
    console.log(`   User: ${testAccount.user}`);
    console.log(`   Pass: ${testAccount.pass}`);

    const transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    transporterCache = transporter;
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create Ethereal test email account:', error.message);
    throw error;
  }
};

/**
 * Send an email with custom options
 * @param {Object} options - { email, subject, message, html }
 */
export const sendEmail = async (options) => {
  const transporter = await getTransporter();

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"Maya Angelou Backend" <no-reply@maya-angelou.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  const info = await transporter.sendMail(mailOptions);

  // If using Ethereal email, print the preview URL!
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    console.log(`📬 Test email sent successfully!`);
    console.log(`👉 View Preview: ${previewUrl}`);
  } else {
    console.log(`✉️ Production email sent to ${options.email} (Message ID: ${info.messageId})`);
  }

  return info;
};
