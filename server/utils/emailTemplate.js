export const otpEmailTemplate = (otp) => {
  return `
      <!DOCTYPE html>
<html>
  <body style="margin:0; padding:20px; background:#f2f6ff; font-family:Arial, Helvetica, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(90deg,#4b6aff,#6ae8c5); padding:24px; text-align:center;">
          <h2 style="margin:0; color:#fff; font-size:24px;">VibeChat Verification</h2>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:30px; text-align:center;">

          <p style="color:#444; font-size:15px; margin:0 0 20px;">
            Use the following OTP to verify your email.  
            <br>
            This OTP is valid for <strong>10 minutes</strong>.
          </p>

          <!-- OTP Box -->
          <div style="
            display:inline-block;
            background:#f7f9ff;
            border:1px solid #dce3ff;
            padding:18px 28px;
            border-radius:12px;
          ">
            <p style="
              margin:0;
              font-size:36px;
              font-weight:bold;
              letter-spacing:8px;
              color:#1a2b5f;
            ">
              ${otp}
            </p>
          </div>

          <p style="margin-top:20px; font-size:13px; color:#777;">
            If you didn’t request this, you can ignore this email.
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8faff; padding:15px; text-align:center; font-size:12px; color:#888;">
          © 2025 VibeChat
        </td>
      </tr>

    </table>

  </body>
</html>

    `;
};

export const passwordResetTemplate = (name, resetLink) => `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:20px; background:#f2f6ff; font-family:Arial, Helvetica, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:500px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(90deg,#4b6aff,#6ae8c5); padding:24px; text-align:center;">
          <h2 style="margin:0; color:#fff; font-size:24px;">VibeChat Password Reset</h2>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:30px; text-align:center;">

          <p style="color:#444; font-size:15px; margin:0 0 20px;">
            Hi <strong>${name}</strong>,  
            <br><br>
            We received a request to reset your VibeChat password.
            <br>
            Click the button below to set a new password.
          </p>

          <!-- Reset Button -->
          <a href="${resetLink}" 
            style="
              display:inline-block;
              background:#2047ff;
              color:#ffffff;
              padding:14px 28px;
              border-radius:8px;
              text-decoration:none;
              font-size:16px;
              font-weight:bold;
              margin-top:10px;
            ">
            Reset Password
          </a>

          <p style="margin-top:25px; font-size:13px; color:#777; line-height:1.6;">
            If you did not request a password reset, you can ignore this email.
            <br>
            This link will expire soon for your security.
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8faff; padding:15px; text-align:center; font-size:12px; color:#888;">
          © 2025 VibeChat — All Rights Reserved
        </td>
      </tr>

    </table>

  </body>
</html>

`;

export const welcomeEmail = (name)=>{
  return `
  <!DOCTYPE html>
<html>
  <body style="margin:0; padding:20px; background:#f2f6ff; font-family:Arial, Helvetica, sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(90deg,#4b6aff,#6ae8c5); padding:28px; text-align:center;">
          <h2 style="margin:0; color:#fff; font-size:26px; font-weight:700;">
            Welcome to VibeChat 🎉
          </h2>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:32px; text-align:center;">

          <p style="color:#444; font-size:16px; margin:0 0 20px;">
            Hi <strong>${name}</strong>,
          </p>

          <p style="color:#4a4a4a; font-size:15px; line-height:1.6; margin:0 0 20px;">
            We're excited to have you on VibeChat!  
            Your account has been successfully created, and you're all set to start chatting, connecting, and vibing with people around the world.
          </p>

          <div style="
            display:inline-block;
            padding:18px 25px;
            background:#f5f8ff;
            border:1px solid #dce3ff;
            border-radius:10px;
            color:#1a2b5f;
            font-size:14px;
            margin-top:10px;
            line-height:1.6;
          ">
            Start exploring new chats, join conversations,<br>
            and experience real-time messaging with ease!
          </div>

          <p style="margin-top:25px; font-size:13px; color:#777; line-height:1.6;">
            If you ever need help, we're always here for you.
          </p>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#f8faff; padding:15px; text-align:center; font-size:12px; color:#888;">
          © 2025 VibeChat — All Rights Reserved
        </td>
      </tr>

    </table>

  </body>
</html>

  `
}

