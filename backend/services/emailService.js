const nodemailer = require('nodemailer');
const { Resend } = require('resend');
const SibApiV3Sdk = require('sib-api-v3-sdk');

// Multi-provider email service for notifications: winner announcements, verifications, subscriptions, alerts
class EmailService {
  constructor() {
    // Initialize email provider (brevo, resend, sendgrid, or nodemailer)
    if (process.env.EMAIL_SERVICE === 'brevo') {
      // Brevo (formerly Sendinblue) - recommended for free tier (300 emails/day)
      this.provider = 'brevo';
      const defaultClient = SibApiV3Sdk.ApiClient.instance;
      defaultClient.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;
      this.emailApi = new SibApiV3Sdk.TransactionalEmailsApi();
    } else if (process.env.EMAIL_SERVICE === 'resend') {
      // Resend.com (optional)
      this.provider = 'resend';
      this.resend = new Resend(process.env.RESEND_API_KEY);
    } else if (process.env.EMAIL_SERVICE === 'sendgrid') {
      // SendGrid (alternative)
      this.provider = 'sendgrid';
      this.sgMail = require('@sendgrid/mail');
      this.sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    } else {
      // Nodemailer (local SMTP or Gmail)
      this.provider = 'nodemailer';
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || 587, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
    }
    this.fromEmail = process.env.EMAIL_FROM || 'noreply@golfgive.co';
    this.brandName = 'GolfGive';
  }

  async send(to, subject, htmlContent) {
    // Send email via configured provider (brevo, resend, sendgrid, or nodemailer)
    try {
      if (this.provider === 'brevo') {
        const sendSmtpEmail = {
          to: [{ email: to }],
          sender: { name: this.brandName, email: this.fromEmail },
          subject,
          htmlContent,
        };
        await this.emailApi.sendTransacEmail(sendSmtpEmail);
      } else if (this.provider === 'resend') {
        const response = await this.resend.emails.send({
          from: `${this.brandName} <${this.fromEmail}>`,
          to,
          subject,
          html: htmlContent,
        });
        if (response.error) {
          throw new Error(response.error.message);
        }
      } else if (this.provider === 'sendgrid') {
        await this.sgMail.send({
          from: this.fromEmail,
          to,
          subject,
          html: htmlContent,
        });
      } else {
        await this.transporter.sendMail({
          from: `${this.brandName} <${this.fromEmail}>`,
          to,
          subject,
          html: htmlContent,
        });
      }
      console.log(`✓ Email sent to ${to}: ${subject}`);
    } catch (err) {
      console.error(`✗ Failed to send email to ${to}:`, err.message);
      throw err;
    }
  }

  // Send winner announcement with prize details and proof upload CTA
  async sendWinnerAnnouncement(user, draw, matchType, prizeAmount) {
    const prizes = { 5: '🏆 Jackpot', 4: '🥈 Major Prize', 3: '🥉 Prize' };
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981; text-align: center;">🎉 Congratulations!</h1>
        <p>Hi ${user.name},</p>
        <p>Great news! You've won a prize in the <strong>${draw.month_year}</strong> draw!</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
          <p><strong>Prize Tier:</strong> ${prizes[matchType]} (${matchType}-Number Match)</p>
          <p style="font-size: 24px; color: #10b981; margin: 10px 0;">
            <strong>£${Number(prizeAmount).toFixed(2)}</strong>
          </p>
          <p><strong>Draw Numbers:</strong> ${draw.numbers.join(' · ')}</p>
        </div>

        <p><strong>What's Next:</strong></p>
        <ol>
          <li>Log in to your GolfGive dashboard</li>
          <li>Go to your Winnings section</li>
          <li>Upload proof (screenshot from golf platform)</li>
          <li>Our team will verify and process your payout</li>
        </ol>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard/winnings" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            View Your Winnings
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          GolfGive • Charity Through Golf<br>
          ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `;

    await this.send(user.email, `${prizes[matchType]} Won! ${draw.month_year}`, html);
  }

  // Send winner verification result (approved/rejected) with payout timeline
  async sendVerificationNotification(user, draw, matchType, prizeAmount, status) {
    const statusText = status === 'verified' ? 'Approved ✓' : 'Rejected ✗';
    const statusColor = status === 'verified' ? '#10b981' : '#ef4444';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: ${statusColor}; text-align: center;">Prize Verification: ${statusText}</h1>
        <p>Hi ${user.name},</p>
        
        <p>Your prize submission for the <strong>${draw.month_year}</strong> draw has been ${status}.</p>
        
        <div style="background: ${status === 'verified' ? '#f0fdf4' : '#fef2f2'}; border-left: 4px solid ${statusColor}; padding: 16px; margin: 20px 0;">
          <p><strong>Prize:</strong> £${Number(prizeAmount).toFixed(2)}</p>
          <p><strong>Status:</strong> ${statusText}</p>
          ${status === 'verified' ? '<p><strong>Payout:</strong> Expected within 5-7 business days</p>' : '<p><strong>Action Required:</strong> Check your dashboard for details</p>'}
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard/winnings" style="background: ${statusColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            View Details
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          GolfGive Support: ${process.env.SUPPORT_EMAIL}
        </p>
      </div>
    `;

    await this.send(user.email, `Prize ${statusText} - ${draw.month_year}`, html);
  }

  // ─── DRAW RESULTS NOTIFICATION ───────────────────────────────────────────
  async sendDrawResultsDigest(winners, draw) {
    // Batch notification for all winners (or individual?)
    // Individual is better - this is template for reference
    const totalWinners = Object.values(winners).flat().length;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981; text-align: center;">🎲 ${draw.month_year} Draw Results</h1>
        <p>The monthly draw has been published!</p>
        
        <div style="background: #fff3cd; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0;">
          <p><strong>Draw Numbers:</strong> ${draw.numbers.join(' · ')}</p>
          <p><strong>Prize Pool:</strong> £${Number(draw.prize_pool).toFixed(2)}</p>
          <p><strong>Jackpot:</strong> £${Number(draw.jackpot_amount).toFixed(2)}</p>
        </div>

        <p><strong>Winners This Round:</strong></p>
        <ul>
          <li>🏆 Jackpot (5-Match): ${winners[5]?.length || 0} winner${winners[5]?.length !== 1 ? 's' : ''}</li>
          <li>🥈 Major (4-Match): ${winners[4]?.length || 0} winner${winners[4]?.length !== 1 ? 's' : ''}</li>
          <li>🥉 Prize (3-Match): ${winners[3]?.length || 0} winner${winners[3]?.length !== 1 ? 's' : ''}</li>
        </ul>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Check Results
          </a>
        </p>
      </div>
    `;

    return html; // Return template for batch processing
  }

  // Send subscription confirmation with plan details and charity allocation breakdown
  async sendSubscriptionConfirmation(user, plan, amount, charityPercentage, charityName) {
    const charityAmount = (amount * charityPercentage / 100).toFixed(2);
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #10b981; text-align: center;">✓ Subscription Confirmed</h1>
        <p>Hi ${user.name},</p>
        <p>Your <strong>${plan === 'yearly' ? 'yearly' : 'monthly'}</strong> subscription to GolfGive is now active!</p>
        
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 20px 0;">
          <p><strong>Plan:</strong> ${plan === 'yearly' ? 'Annual' : 'Monthly'}</p>
          <p><strong>Amount:</strong> £${Number(amount).toFixed(2)}</p>
          <p><strong>Charity Allocation:</strong> £${charityAmount} (${charityPercentage}%) → ${charityName}</p>
          <p style="color: #10b981;"><strong>Next Renewal:</strong> ${new Date(new Date().setMonth(new Date().getMonth() + (plan === 'yearly' ? 12 : 1))).toLocaleDateString('en-GB')}</strong></p>
        </div>

        <p><strong>You can now:</strong></p>
        <ul>
          <li>✓ Enter your golf scores</li>
          <li>✓ Participate in monthly draws</li>
          <li>✓ Win prizes and support your charity</li>
        </ul>

        <p style="text-align: center; margin-top: 30px;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
            Go to Dashboard
          </a>
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #64748b; font-size: 12px; text-align: center;">
          GolfGive • Subscription Notice<br>
          You can manage or cancel your subscription anytime from your dashboard
        </p>
      </div>
    `;

    await this.send(user.email, '✓ Your GolfGive Subscription is Active', html);
  }

  // Send admin notifications for operational events (errors, payouts, etc)
  async sendAdminAlert(subject, content) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>⚠️ Admin Alert</h2>
        <h3>${subject}</h3>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 20px 0;">
          ${content}
        </div>
        <p style="color: #64748b; font-size: 12px;">
          Sent: ${new Date().toLocaleString('en-GB')}
        </p>
      </div>
    `;

    await this.send(process.env.ADMIN_EMAIL || process.env.EMAIL_FROM, subject, html);
  }
}

module.exports = new EmailService();
