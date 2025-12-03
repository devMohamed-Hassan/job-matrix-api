import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import { OtpType } from "../user/entities/user.entity";

export interface SendOtpEmailOptions {
  to: string;
  otp: string;
  type: OtpType;
  userName?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    const emailUser = this.configService.get<string>("emailUser");
    const emailPass = this.configService.get<string>("emailPass");

    if (!emailUser || !emailPass) {
      console.warn(
        "Email configuration is incomplete. Email service may not work properly."
      );
    }

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });
  }

  async sendOtpEmail(options: SendOtpEmailOptions): Promise<void> {
    const { to, otp, type, userName } = options;
    const emailFrom = this.configService.get<string>("emailUser");
    const expiryMinutes = 10;

    const subject =
      type === OtpType.CONFIRM_EMAIL
        ? "Confirm Your Email Address"
        : "Reset Your Password";

    const plainTextContent = this.getPlainTextTemplate({
      otp,
      type,
      userName: userName || to,
      expiryMinutes,
    });

    const htmlContent = this.getHtmlTemplate({
      otp,
      type,
      userName: userName || to,
      expiryMinutes,
    });

    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text: plainTextContent,
        html: htmlContent,
      });
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  private getPlainTextTemplate(options: {
    otp: string;
    type: OtpType;
    userName: string;
    expiryMinutes: number;
  }): string {
    const { otp, type, userName, expiryMinutes } = options;

    const purpose =
      type === OtpType.CONFIRM_EMAIL
        ? "confirm your email address"
        : "reset your password";

    return `
Hello ${userName},

You have requested to ${purpose}. Please use the following One-Time Password (OTP) to complete the process:

OTP Code: ${otp}

This OTP will expire in ${expiryMinutes} minutes.

If you did not request this, please ignore this email.

Best regards,
Job Matrix Team
    `.trim();
  }

  private getHtmlTemplate(options: {
    otp: string;
    type: OtpType;
    userName: string;
    expiryMinutes: number;
  }): string {
    const { otp, type, userName, expiryMinutes } = options;

    const purpose =
      type === OtpType.CONFIRM_EMAIL
        ? "confirm your email address"
        : "reset your password";

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OTP Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Job Matrix</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Hello <strong>${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                You have requested to ${purpose}. Please use the following One-Time Password (OTP) to complete the process:
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 30px; text-align: center; margin: 30px 0;">
                <p style="margin: 0 0 10px; color: #666666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your OTP Code</p>
                <p style="margin: 0; color: #667eea; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</p>
              </div>
              
              <p style="margin: 20px 0; color: #666666; font-size: 14px; line-height: 1.6;">
                ⏰ This OTP will expire in <strong>${expiryMinutes} minutes</strong>.
              </p>
              
              <p style="margin: 20px 0 0; color: #999999; font-size: 14px; line-height: 1.6;">
                If you did not request this, please ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: #667eea;">Job Matrix Team</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  async sendApplicationStatusEmail(options: {
    to: string;
    applicantName: string;
    jobTitle: string;
    companyName: string;
    status: 'accepted' | 'rejected';
  }): Promise<void> {
    const { to, applicantName, jobTitle, companyName, status } = options;
    const emailFrom = this.configService.get<string>("emailUser");

    const subject =
      status === 'accepted'
        ? `Congratulations! Your application for ${jobTitle} has been accepted`
        : `Application Update: ${jobTitle}`;

    const plainTextContent = this.getApplicationStatusPlainTextTemplate({
      applicantName,
      jobTitle,
      companyName,
      status,
    });

    const htmlContent = this.getApplicationStatusHtmlTemplate({
      applicantName,
      jobTitle,
      companyName,
      status,
    });

    try {
      await this.transporter.sendMail({
        from: emailFrom,
        to,
        subject,
        text: plainTextContent,
        html: htmlContent,
      });
    } catch (error) {
      console.error("Error sending application status email:", error);
      throw new Error("Failed to send email");
    }
  }

  private getApplicationStatusPlainTextTemplate(options: {
    applicantName: string;
    jobTitle: string;
    companyName: string;
    status: 'accepted' | 'rejected';
  }): string {
    const { applicantName, jobTitle, companyName, status } = options;

    if (status === 'accepted') {
      return `
Dear ${applicantName},

We are delighted to inform you that your application for the position of ${jobTitle} at ${companyName} has been accepted!

We were impressed with your qualifications and experience, and we believe you would be a great addition to our team.

Our HR team will be in touch with you shortly to discuss the next steps in the hiring process, including details about your start date and any additional documentation we may need.

We look forward to welcoming you to ${companyName}!

Best regards,
The Hiring Team at ${companyName}
      `.trim();
    } else {
      return `
Dear ${applicantName},

Thank you for your interest in the ${jobTitle} position at ${companyName}.

After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our requirements at this time.

We appreciate the time and effort you invested in your application. We encourage you to continue exploring opportunities with us, as we regularly post new positions that may align with your skills and experience.

We wish you the best of luck in your job search and future endeavors.

Best regards,
The Hiring Team at ${companyName}
      `.trim();
    }
  }

  private getApplicationStatusHtmlTemplate(options: {
    applicantName: string;
    jobTitle: string;
    companyName: string;
    status: 'accepted' | 'rejected';
  }): string {
    const { applicantName, jobTitle, companyName, status } = options;

    const isAccepted = status === 'accepted';
    const headerColor = isAccepted
      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const icon = isAccepted ? '✅' : '📋';
    const mainColor = isAccepted ? '#10b981' : '#667eea';

    if (isAccepted) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Accepted</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: ${headerColor}; border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Congratulations!</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${applicantName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We are delighted to inform you that your application for the position of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been <strong style="color: ${mainColor};">accepted</strong>!
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                We were impressed with your qualifications and experience, and we believe you would be a great addition to our team.
              </p>
              
              <div style="background-color: #f0fdf4; border-left: 4px solid ${mainColor}; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #166534; font-size: 14px; line-height: 1.6;">
                  <strong>Next Steps:</strong> Our HR team will be in touch with you shortly to discuss the next steps in the hiring process, including details about your start date and any additional documentation we may need.
                </p>
              </div>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                We look forward to welcoming you to <strong>${companyName}</strong>!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: ${mainColor};">The Hiring Team at ${companyName}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();
    } else {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Update</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f4;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f4f4f4;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; background: ${headerColor}; border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">${icon}</div>
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">Application Update</h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Dear <strong>${applicantName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${companyName}</strong>.
              </p>
              
              <p style="margin: 0 0 20px; color: #333333; font-size: 16px; line-height: 1.6;">
                After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our requirements at this time.
              </p>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">
                  <strong>Keep Exploring:</strong> We appreciate the time and effort you invested in your application. We encourage you to continue exploring opportunities with us, as we regularly post new positions that may align with your skills and experience.
                </p>
              </div>
              
              <p style="margin: 20px 0 0; color: #333333; font-size: 16px; line-height: 1.6;">
                We wish you the best of luck in your job search and future endeavors.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f8f9fa; border-radius: 0 0 8px 8px; text-align: center;">
              <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.6;">
                Best regards,<br>
                <strong style="color: ${mainColor};">The Hiring Team at ${companyName}</strong>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim();
    }
  }
}
