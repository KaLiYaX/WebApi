const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Configure your email service
// Use Gmail, SendGrid, or any SMTP service
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // Replace with your email
        pass: 'your-app-password' // Use App Password for Gmail
    }
});

// Generate 4-digit verification code
function generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Send verification email
exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
    const { email, type } = data; // type: 'signup', 'password_reset', 'email_change'
    
    try {
        const code = generateVerificationCode();
        
        // Store verification code in Firestore (expires in 10 minutes)
        await admin.firestore().collection('verification_codes').doc(email).set({
            code: code,
            type: type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000))
        });
        
        // Email template based on type
        let subject, html;
        
        if (type === 'signup') {
            subject = 'KaliyaX API - Email Verification';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 10px;">
                        <h1 style="color: #667eea; margin-bottom: 20px;">Welcome to KaliyaX API! 🎉</h1>
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                            Thank you for signing up! Please verify your email address with the code below:
                        </p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                            <h2 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0;">${code}</h2>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-top: 20px;">
                            This code will expire in 10 minutes.<br>
                            If you didn't request this, please ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="font-size: 12px; color: #999; text-align: center;">
                            © 2025 KaliyaX API. All rights reserved.
                        </p>
                    </div>
                </div>
            `;
        } else if (type === 'password_reset') {
            subject = 'KaliyaX API - Password Reset';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 10px;">
                        <h1 style="color: #667eea; margin-bottom: 20px;">🔐 Password Reset Request</h1>
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                            We received a request to reset your password. Use the code below to continue:
                        </p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                            <h2 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0;">${code}</h2>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-top: 20px;">
                            This code will expire in 10 minutes.<br>
                            If you didn't request this, please ignore this email.
                        </p>
                    </div>
                </div>
            `;
        } else if (type === 'email_change') {
            subject = 'KaliyaX API - Email Change Verification';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 30px; border-radius: 10px;">
                        <h1 style="color: #667eea; margin-bottom: 20px;">📧 Email Change Request</h1>
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
                            Please verify your new email address with the code below:
                        </p>
                        <div style="background: #f0f0f0; padding: 20px; text-align: center; border-radius: 8px; margin: 30px 0;">
                            <h2 style="color: #667eea; font-size: 48px; letter-spacing: 10px; margin: 0;">${code}</h2>
                        </div>
                        <p style="font-size: 14px; color: #666; margin-top: 20px;">
                            This code will expire in 10 minutes.
                        </p>
                    </div>
                </div>
            `;
        }
        
        // Send email
        await transporter.sendMail({
            from: '"KaliyaX API" <your-email@gmail.com>',
            to: email,
            subject: subject,
            html: html
        });
        
        return { success: true, message: 'Verification code sent!' };
    } catch (error) {
        console.error('Error sending email:', error);
        throw new functions.https.HttpsError('internal', 'Failed to send verification email');
    }
});

// Verify code
exports.verifyCode = functions.https.onCall(async (data, context) => {
    const { email, code } = data;
    
    try {
        const doc = await admin.firestore().collection('verification_codes').doc(email).get();
        
        if (!doc.exists) {
            throw new functions.https.HttpsError('not-found', 'Verification code not found');
        }
        
        const data = doc.data();
        const now = admin.firestore.Timestamp.now();
        
        // Check if expired
        if (now.toMillis() > data.expiresAt.toMillis()) {
            await doc.ref.delete();
            throw new functions.https.HttpsError('deadline-exceeded', 'Verification code expired');
        }
        
        // Check if code matches
        if (data.code !== code) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid verification code');
        }
        
        // Delete used code
        await doc.ref.delete();
        
        return { success: true, verified: true };
    } catch (error) {
        throw error;
    }
});

// WhatsApp redirect for support
exports.getWhatsAppLink = functions.https.onCall(async (data, context) => {
    const { message } = data;
    const phoneNumber = '94771198299';
    const encodedMessage = encodeURIComponent(message);
    return { url: `https://wa.me/${phoneNumber}?text=${encodedMessage}` };
});
