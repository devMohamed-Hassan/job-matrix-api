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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative;">
              <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <div style="width: 30px; height: 30px; border: 3px solid #ffffff; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Job Matrix</h1>
              <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 14px; font-weight: 400;">Secure Verification</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 24px; color: #1a202c; font-size: 18px; line-height: 1.6; font-weight: 500;">
                Hello <strong style="color: #667eea;">${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 32px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                You have requested to ${purpose}. Please use the following One-Time Password (OTP) to complete the process:
              </p>
              
              <!-- OTP Box -->
              <table role="presentation" style="width: 100%; margin: 40px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); border: 2px solid #e2e8f0; border-radius: 12px; padding: 40px 30px; text-align: center;">
                    <p style="margin: 0 0 16px; color: #718096; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Your Verification Code</p>
                    <div style="display: inline-block; background-color: #ffffff; padding: 20px 40px; border-radius: 8px; box-shadow: 0 2px 8px rgba(102, 126, 234, 0.15);">
                      <p style="margin: 0; color: #667eea; font-size: 42px; font-weight: 700; letter-spacing: 12px; font-family: 'Courier New', 'Monaco', monospace; line-height: 1;">${otp}</p>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Expiry Notice -->
              <div style="background-color: #fff5e6; border-left: 4px solid #f6ad55; padding: 20px 24px; margin: 32px 0; border-radius: 6px;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 24px; vertical-align: top; padding-right: 12px;">
                      <div style="width: 20px; height: 20px; background-color: #f6ad55; border-radius: 50%; position: relative;">
                        <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 6px solid #ffffff;"></div>
                      </div>
                    </td>
                    <td style="vertical-align: top;">
                      <p style="margin: 0; color: #c05621; font-size: 14px; line-height: 1.6; font-weight: 500;">
                        This OTP will expire in <strong style="color: #9c4221;">${expiryMinutes} minutes</strong>. Please use it promptly to complete your verification.
                      </p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <div style="border-top: 1px solid #e2e8f0; margin: 40px 0 0; padding-top: 32px;">
                <p style="margin: 0; color: #a0aec0; font-size: 14px; line-height: 1.6;">
                  If you did not request this verification code, please ignore this email or contact our support team if you have concerns about your account security.
                </p>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%); border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px; color: #718096; font-size: 14px; line-height: 1.6; font-weight: 500;">
                Best regards,
              </p>
              <p style="margin: 0; color: #667eea; font-size: 16px; font-weight: 600;">
                Job Matrix Team
              </p>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
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
    status: "accepted" | "rejected";
  }): Promise<void> {
    const { to, applicantName, jobTitle, companyName, status } = options;
    const emailFrom = this.configService.get<string>("emailUser");

    const subject =
      status === "accepted"
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
    status: "accepted" | "rejected";
  }): string {
    const { applicantName, jobTitle, companyName, status } = options;

    if (status === "accepted") {
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
    status: "accepted" | "rejected";
  }): string {
    const { applicantName, jobTitle, companyName, status } = options;

    const isAccepted = status === "accepted";
    const headerColor = isAccepted
      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
      : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    const mainColor = isAccepted ? "#10b981" : "#667eea";
    const accentColor = isAccepted ? "#34d399" : "#a78bfa";
    const statusText = isAccepted ? "Congratulations!" : "Application Update";
    const statusSubtext = isAccepted
      ? "Your application has been accepted"
      : "Thank you for your interest";

    if (isAccepted) {
      return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Application Accepted</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: ${headerColor}; position: relative;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.25); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-bottom: 30px solid #ffffff; transform: rotate(-90deg);"></div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${statusText}</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 400;">${statusSubtext}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 24px; color: #1a202c; font-size: 18px; line-height: 1.6; font-weight: 500;">
                Dear <strong style="color: ${mainColor};">${applicantName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We are delighted to inform you that your application for the position of <strong style="color: #2d3748;">${jobTitle}</strong> at <strong style="color: #2d3748;">${companyName}</strong> has been <strong style="color: ${mainColor};">accepted</strong>!
              </p>
              
              <p style="margin: 0 0 32px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We were impressed with your qualifications and experience, and we believe you would be a great addition to our team.
              </p>
              
              <!-- Job Details Card -->
              <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid ${mainColor}; border-radius: 12px; padding: 28px; margin: 32px 0;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 50px; vertical-align: top;">
                      <div style="width: 40px; height: 40px; background-color: ${mainColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <div style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 12px solid #ffffff; transform: rotate(-90deg);"></div>
                      </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 16px;">
                      <p style="margin: 0 0 8px; color: #166534; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Position</p>
                      <p style="margin: 0 0 16px; color: #1a202c; font-size: 18px; font-weight: 600;">${jobTitle}</p>
                      <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Company</p>
                      <p style="margin: 0; color: #1a202c; font-size: 18px; font-weight: 600;">${companyName}</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Next Steps -->
              <div style="background-color: #ecfdf5; border-left: 4px solid ${mainColor}; padding: 24px 28px; margin: 32px 0; border-radius: 8px;">
                <p style="margin: 0 0 12px; color: #166534; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Next Steps</p>
                <p style="margin: 0; color: #065f46; font-size: 15px; line-height: 1.7;">
                  Our HR team will be in touch with you shortly to discuss the next steps in the hiring process, including details about your start date and any additional documentation we may need.
                </p>
              </div>
              
              <p style="margin: 32px 0 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We look forward to welcoming you to <strong style="color: #2d3748;">${companyName}</strong>!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%); border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px; color: #718096; font-size: 14px; line-height: 1.6; font-weight: 500;">
                Best regards,
              </p>
              <p style="margin: 0; color: ${mainColor}; font-size: 16px; font-weight: 600;">
                The Hiring Team at ${companyName}
              </p>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
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
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 50px 40px 30px; text-align: center; background: ${headerColor}; position: relative;">
              <div style="width: 80px; height: 80px; background-color: rgba(255,255,255,0.25); border-radius: 50%; margin: 0 auto 24px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                <div style="width: 40px; height: 40px; border: 3px solid #ffffff; border-radius: 8px; position: relative;">
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(45deg); width: 24px; height: 2px; background-color: #ffffff;"></div>
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); width: 24px; height: 2px; background-color: #ffffff;"></div>
                </div>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${statusText}</h1>
              <p style="margin: 12px 0 0; color: rgba(255,255,255,0.95); font-size: 16px; font-weight: 400;">${statusSubtext}</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <p style="margin: 0 0 24px; color: #1a202c; font-size: 18px; line-height: 1.6; font-weight: 500;">
                Dear <strong style="color: ${mainColor};">${applicantName}</strong>,
              </p>
              
              <p style="margin: 0 0 24px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                Thank you for your interest in the <strong style="color: #2d3748;">${jobTitle}</strong> position at <strong style="color: #2d3748;">${companyName}</strong>.
              </p>
              
              <p style="margin: 0 0 32px; color: #4a5568; font-size: 16px; line-height: 1.7;">
                After careful consideration, we regret to inform you that we have decided to move forward with other candidates whose qualifications more closely match our requirements at this time.
              </p>
              
              <!-- Job Details Card -->
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid ${mainColor}; border-radius: 12px; padding: 28px; margin: 32px 0;">
                <table role="presentation" style="width: 100%;">
                  <tr>
                    <td style="width: 50px; vertical-align: top;">
                      <div style="width: 40px; height: 40px; background-color: ${mainColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                        <div style="width: 24px; height: 24px; border: 2px solid #ffffff; border-radius: 4px;"></div>
                      </div>
                    </td>
                    <td style="vertical-align: top; padding-left: 16px;">
                      <p style="margin: 0 0 8px; color: #6b21a8; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Position</p>
                      <p style="margin: 0 0 16px; color: #1a202c; font-size: 18px; font-weight: 600;">${jobTitle}</p>
                      <p style="margin: 0; color: #6b21a8; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Company</p>
                      <p style="margin: 0; color: #1a202c; font-size: 18px; font-weight: 600;">${companyName}</p>
                    </td>
                  </tr>
                </table>
              </div>
              
              <!-- Keep Exploring -->
              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 24px 28px; margin: 32px 0; border-radius: 8px;">
                <p style="margin: 0 0 12px; color: #92400e; font-size: 15px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Keep Exploring</p>
                <p style="margin: 0; color: #78350f; font-size: 15px; line-height: 1.7;">
                  We appreciate the time and effort you invested in your application. We encourage you to continue exploring opportunities with us, as we regularly post new positions that may align with your skills and experience.
                </p>
              </div>
              
              <p style="margin: 32px 0 0; color: #4a5568; font-size: 16px; line-height: 1.7;">
                We wish you the best of luck in your job search and future endeavors.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 40px; background: linear-gradient(to bottom, #f8f9fa 0%, #ffffff 100%); border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0 0 8px; color: #718096; font-size: 14px; line-height: 1.6; font-weight: 500;">
                Best regards,
              </p>
              <p style="margin: 0; color: ${mainColor}; font-size: 16px; font-weight: 600;">
                The Hiring Team at ${companyName}
              </p>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #a0aec0; font-size: 12px; line-height: 1.5;">
                  This is an automated message. Please do not reply to this email.
                </p>
              </div>
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
