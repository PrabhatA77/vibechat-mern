export const otpEmailTemplate = (otp) => {
  return `
      <h1>Email Verification</h1>
      <p>Your OTP for email verification is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    `;
};

export const passwordResetTemplate = (name, resetLink) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f7f8fa;
      margin: 0;
      padding: 0;
    }
    .container {
      background-color: #ffffff;
      max-width: 500px;
      margin: 30px auto;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.1);
    }
    h2 {
      color: #333333;
    }
    p {
      color: #555555;
      line-height: 1.5;
    }
    .button {
      display: inline-block;
      background-color: #007bff;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 20px;
      border-radius: 5px;
      margin-top: 15px;
      font-weight: bold;
    }
    .footer {
      margin-top: 20px;
      font-size: 12px;
      color: #999999;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Password</h2>
    <p>Hi ${name},</p>
    <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in 1 hour.</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p>If you didn’t request a password reset, please ignore this email.</p>
  </div>
</body>
</html>
`;

