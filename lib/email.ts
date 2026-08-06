import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export async function sendOTPEmail(email: string, name: string, otp: string): Promise<void> {
    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Verify Your MultiPOS Account",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #1A1A2E;">Welcome to MultiPOS!</h2>
                <p>Hi ${name},</p>
                <p>Please verify your email address using the OTP below:</p>
                <div style="
                background: #f5f5f5;
                padding: 20px;
                text-align: center;
                border-radius: 8px;
                margin: 20px 0;
                ">
                <h1 style="
                    font-size: 40px;
                    letter-spacing: 10px;
                    color: #1A1A2E;
                    margin: 0;
                ">${otp}</h1>
                </div>
                <p style="color: #666;">This OTP expires in <strong>10 minutes</strong>.</p>
                <p style="color: #666;">If you did not create a MultiPOS account, ignore this email.</p>
            </div>
              `
    })
}


export async function sendTempPasswordEmail(
  email: string, 
  tempPass: string, 
  name: string, 
  businessSlug: string // Add this parameter
): Promise<void> {
    // Construct the URL based on your frontend structure
    // e.g., http://localhost:3000/login or https://your-pos.com/login
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/login`; 

    await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "Welcome to MultiPOS - Your Login Details",
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; color: #333;">
                <h2 style="color: #1A1A2E;">Welcome to the Team, ${name}!</h2>
                <p>An administrator has created a MultiPOS account for you.</p>
                
                <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; border: 1px dashed #1A1A2E;">
                    <p style="margin: 0; color: #666; font-size: 14px;">TEMPORARY PASSWORD</p>
                    <h1 style="font-size: 32px; color: #1A1A2E; margin: 10px 0;">${tempPass}</h1>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="
                        background-color: #1A1A2E;
                        color: white;
                        padding: 14px 25px;
                        text-decoration: none;
                        border-radius: 5px;
                        font-weight: bold;
                        display: inline-block;
                    ">Login to Your Account</a>
                </div>

                <p style="color: #666;"><strong>Quick Instructions:</strong></p>
                <ul style="color: #666; line-height: 1.6;">
                    <li>Click the button above to go to the login page.</li>
                    <li>Use your email and the temporary password provided.</li>
                    <li>Verify your email via OTP and set your permanent password.</li>
                </ul>

                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                <p style="color: #999; font-size: 12px; text-align: center;">
                    Business ID: ${businessSlug} <br/>
                    If you were not expecting this, please contact your manager.
                </p>
            </div>
        `
    });
}
