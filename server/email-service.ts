import nodemailer from "nodemailer";

// ------------------- Funkcje generujące maile -------------------

export function generateTicketEmail(email: string): { subject: string; html: string } {
  return {
    subject: "Otwórz Ticket - Mamba Obywatel 🐍",
    html: `
      <p>Twoje zamówienie MambaObywatel zostało potwierdzone!</p>
      <p>Email: <strong>${email}</strong></p>
      <p>Aby aktywować dostęp, otwórz ticket na naszym Discordzie.</p>
    `,
  };
}

export function generateReceiptsEmail(email: string, expiresAt: Date): { subject: string; html: string } {
  return {
    subject: "Twój dostęp do MambaReceipts 🐍",
    html: `
      <p>Twoje zamówienie MambaReceipts zostało potwierdzone!</p>
      <p>Email: <strong>${email}</strong></p>
      <p>Dostęp ważny do: <strong>${expiresAt.toLocaleDateString("pl-PL")}</strong></p>
    `,
  };
}

export function generateAccessCodeEmail(email: string, code: string, generatorLink: string): { subject: string; html: string } {
  return {
    subject: "Twój kod dostępu - Mamba Obywatel 🐍",
    html: `
      <p>Twoje zamówienie zostało potwierdzone!</p>
      <p>Email: <strong>${email}</strong></p>
      <p>Twój jednorazowy kod dostępu: <strong>${code}</strong></p>
      <p>Wygeneruj dostęp tutaj: <a href="${generatorLink}">${generatorLink}</a></p>
    `,
  };
}

// ------------------- Funkcja tworząca transporter -------------------

function getEmailTransporter() {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = parseInt(process.env.EMAIL_PORT || "587");
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
    secure: false, // TLS
    auth: { user, pass },
  });

  transporter.verify((error, success) => {
    if (error) console.error("[Email] ❌ SMTP connection failed:", error);
    else if (success) console.log("[Email] ✅ SMTP connection verified");
  });

  return transporter;
}

// ------------------- Funkcje wysyłające maile -------------------

export async function sendTicketEmail(email: string): Promise<boolean> {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("[Email] Gmail credentials not configured");
      return false;
    }

    const emailContent = generateTicketEmail(email);
    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("[Email] Gmail credentials not configured");
      return false;
    }

    const emailContent = generateReceiptsEmail(email, expiresAt);
    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
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
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("[Email] Gmail credentials not configured");
      return false;
    }

    const emailContent = generateAccessCodeEmail(email, code, generatorLink);
    const transporter = getEmailTransporter();

    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
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
