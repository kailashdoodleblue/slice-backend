export interface PasswordResetTemplateParams {
  name?: string;
  resetLink: string;
  portal?: "admin" | "staff";
}

export function getPasswordResetTemplate({
  name,
  resetLink,
  portal = "staff",
}: PasswordResetTemplateParams): {
  subject: string;
  text: string;
  html: string;
} {
  const portalLabel = portal === "admin" ? "Admin Portal" : "Staff Portal";
  const subject =
    portal === "admin" ? "Reset Your Admin Password - Slice" : "Reset Your Password - Slice";
  const greeting = name ? `Hi ${name},` : portal === "admin" ? "Hi Administrator," : "Hello,";

  const text = `${greeting}\n\nYou requested to reset your password for the Slice ${portalLabel}. Please click the link below to set a new password:\n\n${resetLink}\n\nThis link is valid for 1 hour. If you did not request this, please ignore this email.\n`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1a202c;">${portalLabel} Password Reset Request</h2>
      <p>${greeting}</p>
      <p>You recently requested to reset your password for your Slice ${portalLabel} account. Click the button below to reset it:</p>
      <div style="margin: 24px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748b; font-size: 14px;">This link will expire in 1 hour.</p>
      <p style="color: #64748b; font-size: 14px;">If you didn't ask to reset your password, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">If the button above does not work, copy and paste this link into your browser:<br/><a href="${resetLink}">${resetLink}</a></p>
    </div>
  `;

  return { subject, text, html };
}

