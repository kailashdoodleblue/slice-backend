import nodemailer, { Transporter } from "nodemailer";
import { env } from "../config/env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

let cachedTransporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  const isSmtpConfigured = Boolean(env.smtp.host && env.smtp.user);
  if (!isSmtpConfigured) {
    return null;
  }

  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }

  return cachedTransporter;
}

/**
 * Common reusable function to send emails
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
}: SendEmailOptions): Promise<void> {
  const transporter = getTransporter();

  // If SMTP is not configured (e.g. in local development), log to console
  if (!transporter) {
    console.log("============================== [EMAIL SIMULATION] ==============================");
    console.log(`To: ${to}`);
    console.log(`From: ${from || env.smtp.from}`);
    console.log(`Subject: ${subject}`);
    if (text) {
      console.log(`Content:\n${text}`);
    }
    console.log("================================================================================");
    return;
  }

  await transporter.sendMail({
    from: from || env.smtp.from,
    to,
    subject,
    text,
    html,
  });
}
