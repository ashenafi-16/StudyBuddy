def create_welcome_email_template(username, client_url):
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta username="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Messenger</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                 line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; 
                 padding: 20px; background-color: #f5f5f5;">
        <div style="background: linear-gradient(to right, #36D1DC, #5B86E5); 
                    padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <img src="https://img.freepik.com/free-vector/hand-drawn-message-element-vector-cute-sticker_53876-118344.jpg"
                 alt="Messenger Logo"
                 style="width: 80px; height: 80px; margin-bottom: 20px; border-radius: 50%;
                        background-color: white; padding: 10px;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 500;">
                Welcome to StudyBuddy!
            </h1>
        </div>

        <div style="background-color: #ffffff; padding: 35px; border-radius: 0 0 12px 12px;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <p style="font-size: 18px; color: #5B86E5;">
                <strong>Hello {username},</strong>
            </p>
            <p>We're excited to have you join our messaging platform!</p>

            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 10px;
                        margin: 25px 0; border-left: 4px solid #36D1DC;">
                <p><strong>Get started in just a few steps:</strong></p>
                <ul>
                    <li>Set up your profile picture</li>
                    <li>Find and add your contacts</li>
                    <li>Start a conversation</li>
                    <li>Share photos, videos, and more</li>
                </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{client_url}"
                   style="background: linear-gradient(to right, #36D1DC, #5B86E5); color: white;
                          text-decoration: none; padding: 12px 30px; border-radius: 50px;
                          font-weight: 500;">
                   Open Messenger
                </a>
            </div>

            <p>If you need any help, we're always here to assist you.</p>
            <p>Happy messaging!</p>

            <p>Best regards,<br>The Messenger Team</p>
        </div>

        <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>© 2025 Messenger. All rights reserved.</p>
        </div>
    </body>
    </html>
    """
