import nodemailer from "nodemailer";
import { passwordResetTemplate } from "./emailTemplate.js";

export const sendEmail = async (to, subject, html) => {
  try {
    console.log("Attempting to send email");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.Email_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    //VERIFY SMTP CONNECTION
    await transporter.verify();
    console.log("SMTP Connection verified");

    await transporter.sendMail({
      from: `"SignUp-Login" <${process.env.Email_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Email sent successfully: ");
    console.log(`Delivered to ${to}`);

    return true;
  } catch (error) {
    console.log("email sending failed");
    console.log("error name : ", error.name);
    throw error;
  }
};

export const sendWelcomeEmail = async (toEmail, name) => {
  
  const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.Email_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

  const mailOptions = {
    from: `"Your App" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'Welcome to Our App 🎉',
    html: `
      <h2>Welcome, ${name}!</h2>
      <p>We are so happy you joined. Start exploring your account now!</p>
      <p>The Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
};

export const sendPasswordResetEmail = async (to, name, resetLink) => {
  try {
    console.log("Attempting to send email");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.Email_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    //VERIFY SMTP CONNECTION
    await transporter.verify();
    console.log("SMTP Connection verified");

    const subject = "Password Reset Instructions";
    const html = passwordResetTemplate(name, resetLink);
    const text = `
Hi ${name},

We received a request to reset your password.

Please click the link below to set a new password:
${resetLink}

If you didn't request this, you can ignore this email.
`;

    await transporter.sendMail({
      from: `"SignUp-Login" <${process.env.Email_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`✅ Password reset email sent to ${to}`);

    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    throw new Error('Failed to send email');
  }
};

export const sendResetSuccessEmail = async (to) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"YourApp Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Your password has been changed",
    text: `Your password was successfully changed. If this wasn't you, please contact support immediately.`,
  };

  await transporter.sendMail(mailOptions);
};
