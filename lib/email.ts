import { Resend } from "resend";

const resend = new Resend(process.env.EMAIL_API_KEY);

export interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(options: SendEmailOptions) {
    try {
        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM || "Performance Management <onboarding@resend.dev>",
            to: options.to,
            subject: options.subject,
            html: options.html,
            text: options.text,
        });

        if (error) {
            console.error("Email send error:", error);
            return { success: false, error: error.message };
        }

        return { success: true, data };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error: "Failed to send email" };
    }
}

export async function sendPasswordResetEmail(email: string, token: string, name: string) {
    const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${token}`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your Performance Management account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>Performance Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    const text = `
    Hi ${name},

    We received a request to reset your password for your Performance Management account.

    Click this link to reset your password:
    ${resetUrl}

    This link will expire in 1 hour.

    If you didn't request this password reset, you can safely ignore this email.

    Best regards,
    Performance Management Team
  `;

    return sendEmail({
        to: email,
        subject: "Reset Your Password - Performance Management",
        html,
        text,
    });
}

export async function sendWelcomeEmail(email: string, name: string, tempPassword: string) {
    const loginUrl = `${process.env.AUTH_URL}/login`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .credentials { background: #fff; border: 2px solid #10b981; padding: 15px; border-radius: 6px; margin: 20px 0; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Performance Management!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            <div class="credentials">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>
            <p><strong>⚠️ Important:</strong> Please change your password after your first login for security.</p>
            <p style="text-align: center;">
              <a href="${loginUrl}" class="button">Login Now</a>
            </p>
            <p>If you have any questions, please contact your administrator.</p>
            <p>Best regards,<br>Performance Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    const text = `
    Hi ${name},

    Your account has been created successfully. Here are your login credentials:

    Email: ${email}
    Temporary Password: ${tempPassword}

    ⚠️ Important: Please change your password after your first login for security.

    Login at: ${loginUrl}

    If you have any questions, please contact your administrator.

    Best regards,
    Performance Management Team
  `;

    return sendEmail({
        to: email,
        subject: "Welcome to Performance Management!",
        html,
        text,
    });
}

export async function sendEvidenceReminderEmail(
    email: string,
    name: string,
    goalTitle: string,
    daysSinceLastEvidence: number
) {
    const evidenceUrl = `${process.env.AUTH_URL}/goals`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .goal-box { background: #fff; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Evidence Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>It's been <strong>${daysSinceLastEvidence} days</strong> since you last added evidence for this goal:</p>
            <div class="goal-box">
              <h3>${goalTitle}</h3>
            </div>
            <p>Regular evidence updates help demonstrate your progress and impact. Consider adding:</p>
            <ul>
              <li>Recent accomplishments or milestones</li>
              <li>Metrics showing improvement</li>
              <li>Links to completed work or documentation</li>
              <li>Feedback from stakeholders</li>
            </ul>
            <p style="text-align: center;">
              <a href="${evidenceUrl}" class="button">Add Evidence Now</a>
            </p>
            <p>Keep up the great work!</p>
            <p>Best regards,<br>Performance Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated reminder. You can manage notification preferences in your profile.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: `Reminder: Add evidence for "${goalTitle}"`,
        html,
    });
}

export async function sendWeeklySummaryEmail(
    email: string,
    name: string,
    summary: {
        activeGoals: number;
        evidenceAdded: number;
        currentRank: number;
        totalUsers: number;
        topAchievement?: string;
    }
) {
    const dashboardUrl = `${process.env.AUTH_URL}/dashboard`;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
          .stat-box { background: #fff; padding: 15px; border-radius: 6px; text-align: center; border: 2px solid #8b5cf6; }
          .stat-number { font-size: 32px; font-weight: bold; color: #8b5cf6; }
          .stat-label { font-size: 14px; color: #6b7280; }
          .achievement { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Weekly Summary</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Here's your performance summary for this week:</p>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-number">${summary.activeGoals}</div>
                <div class="stat-label">Active Goals</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${summary.evidenceAdded}</div>
                <div class="stat-label">Evidence Added</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">#${summary.currentRank}</div>
                <div class="stat-label">Current Rank</div>
              </div>
              <div class="stat-box">
                <div class="stat-number">${summary.totalUsers}</div>
                <div class="stat-label">Total Team</div>
              </div>
            </div>

            ${summary.topAchievement
            ? `
              <div class="achievement">
                <h3>🏆 Top Achievement This Week</h3>
                <p>${summary.topAchievement}</p>
              </div>
            `
            : ""
        }

            <p style="text-align: center;">
              <a href="${dashboardUrl}" class="button">View Full Dashboard</a>
            </p>

            <p>Keep up the excellent work!</p>
            <p>Best regards,<br>Performance Management Team</p>
          </div>
          <div class="footer">
            <p>This is an automated weekly summary. You can manage notification preferences in your profile.</p>
          </div>
        </div>
      </body>
    </html>
  `;

    return sendEmail({
        to: email,
        subject: "Your Weekly Performance Summary",
        html,
    });
}
