import nodemailer from "nodemailer";

// Create email transporter
function getEmailTransporter() {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = parseInt((process.env.EMAIL_PORT || "587").trim());
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();

  if (!user || !pass) {
    console.error("❌ Email credentials missing - EMAIL_USER:", user ? "✓" : "✗", "EMAIL_PASS:", pass ? "✓" : "✗");
  } else {
    console.log("[Email] Credentials found, creating transporter for:", user);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // TLS if port 465
    auth: {
      user,
      pass,
    },
  });

  // Verify connection immediately
  transporter.verify((error, success) => {
    if (error) {
      console.error("[Email] ❌ SMTP connection failed:", error);
    } else if (success) {
      console.log("[Email] ✅ SMTP connection verified");
    }
  });

  return transporter;
}

// Funkcje generujące treść maili pozostają takie same, ale przy wysyłaniu używamy .trim()
export async function sendTicketEmail(email: string): Promise<boolean> {
  try {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.trim();

    if (!user || !pass) {
      console.warn("[Email] Gmail credentials not configured");
      return false;
    }

    const emailContent = generateTicketEmail(email);
    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from: user,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`[Email] ✅ Ticket email sent to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send ticket email:", error);
    return false;
  }
}

export async function sendReceiptsEmail(email: string, expiresAt: Date): Promise<boolean> {
  try {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.trim();

    if (!user || !pass) {
      console.warn("[Email] Gmail credentials not configured");
      return false;
    }

    const emailContent = generateReceiptsEmail(email, expiresAt);
    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from: user,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`[Email] ✅ Receipts email sent to ${email}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send receipts email:", error);
    return false;
  }
}

export async function sendAccessCodeEmail(email: string, code: string, generatorLink: string): Promise<boolean> {
  try {
    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS?.trim();

    if (!user || !pass) {
      console.warn("[Email] Gmail credentials not configured");
      return false;
    }

    const emailContent = generateAccessCodeEmail(email, code, generatorLink);
    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from: user,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`[Email] ✅ Access code email sent to ${email} with code ${code}, messageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send access code email:", error);
    return false;
  }
}
