import nodemailer from "nodemailer";

// --- Funkcja tworząca transporter ---
function getEmailTransporter() {
  const host = (process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const port = 465; // TLS
  const user = process.env.EMAIL_USER?.trim();
  const pass = process.env.EMAIL_PASS?.trim();

  if (!user || !pass) {
    console.error("❌ Email credentials missing - EMAIL_USER:", user ? "✓" : "✗", "EMAIL_PASS:", pass ? "✓" : "✗");
    return null;
  }

  console.log("[Email] Credentials found, creating transporter for:", user);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true, // TLS
    auth: {
      user,
      pass,
    },
  });

  transporter.verify((error, success) => {
    if (error) {
      console.error("[Email] ❌ SMTP connection failed:", error);
    } else if (success) {
      console.log("[Email] ✅ SMTP connection verified");
    }
  });

  return transporter;
}

// --- Szablony email ---
export function generateTicketEmail(email: string) {
  return {
    subject: "Otwórz Ticket - Mamba Obywatel 🐍",
    html: `<p>Twoje zamówienie zostało potwierdzone. Email: ${email}</p>`,
  };
}

export function generateReceiptsEmail(email: string, expiresAt: Date) {
  return {
    subject: "Twój dostęp do MambaReceipts 🐍",
    html: `<p>Twój dostęp wygasa: ${expiresAt.toLocaleDateString("pl-PL")}</p>`,
  };
}

export function generateAccessCodeEmail(email: string, code: string, generatorLink: string) {
  return {
    subject: "Twój kod dostępu - Mamba Obywatel 🐍",
    html: `<p>Twój kod: ${code}<br>Generator: ${generatorLink}</p>`,
  };
}

// --- Funkcje wysyłki ---
export async function sendTicketEmail(email: string): Promise<boolean> {
  try {
    const transporter = getEmailTransporter();
    if (!transporter) return false;

    const emailContent = generateTicketEmail(email);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER?.trim(),
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
    const transporter = getEmailTransporter();
    if (!transporter) return false;

    const emailContent = generateReceiptsEmail(email, expiresAt);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER?.trim(),
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
    const transporter = getEmailTransporter();
    if (!transporter) return false;

    const emailContent = generateAccessCodeEmail(email, code, generatorLink);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER?.trim(),
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
