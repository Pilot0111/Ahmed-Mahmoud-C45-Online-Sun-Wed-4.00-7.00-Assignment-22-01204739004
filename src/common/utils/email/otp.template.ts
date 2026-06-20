export const otpTemplate = ({ userName = 'User', otp, subject = 'Verification Code' }: { userName?: string, otp: string, subject?: string }) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body {
                margin: 0;
                padding: 0;
                background-color: #f4f7f6;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                -webkit-font-smoothing: antialiased;
            }
            .container {
                max-width: 500px;
                margin: 40px auto;
                background: #ffffff;
                border-radius: 12px;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.04);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #e0234e 0%, #ff4b2b 100%);
                padding: 30px 20px;
                text-align: center;
            }
            .header h1 {
                color: #ffffff;
                margin: 0;
                font-size: 24px;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .content {
                padding: 40px 30px;
                text-align: center;
                color: #4a4a4a;
            }
            .content p {
                font-size: 16px;
                line-height: 1.6;
                margin: 0 0 20px 0;
            }
            .greeting {
                font-size: 20px;
                font-weight: 600;
                color: #2d3748;
                margin-bottom: 15px;
            }
            .otp-wrapper {
                margin: 30px 0;
                padding: 20px;
                background: #f8fafc;
                border-radius: 10px;
                border: 1px solid #e2e8f0;
            }
            .otp-code {
                font-size: 36px;
                font-weight: 700;
                color: #e0234e;
                letter-spacing: 8px;
                margin: 0;
                font-family: monospace;
            }
            .note {
                font-size: 14px;
                color: #718096;
                margin-top: 20px;
            }
            .footer {
                background-color: #f8fafc;
                padding: 20px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }
            .footer p {
                margin: 0;
                font-size: 13px;
                color: #a0aec0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Saraha App using NestJs</h1>
            </div>
            <div class="content">
                <div class="greeting">Hello ${userName},</div>
                <p>You requested a code for <strong>${subject}</strong>. Please use the following One-Time Password to complete your request:</p>
                
                <div class="otp-wrapper">
                    <div class="otp-code">${otp}</div>
                </div>
                
                <p class="note">This code will expire in 10 minutes. If you didn't request this action, you can safely ignore this email.</p>
            </div>
            <div class="footer">
                <p>&copy; ${new Date().getFullYear()} Saraha App using NestJs. Built with modern tools.</p>
            </div>
        </div>
    </body>
    </html>
    `;
};