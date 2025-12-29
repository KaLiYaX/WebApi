// FILE: functions/index.js - COMPLETE VERSION WITH EMAIL VERIFICATION

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ⚠️ IMPORTANT: ඔබේ Gmail credentials මෙතන දාන්න
// Gmail account එකට 2-Step Verification enable කරලා App Password එකක් generate කරන්න
// https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com', // ඔබේ Gmail
        pass: 'your-app-password' // Gmail App Password (16 characters)
    }
});

// 4-digit verification code generate කරන්න
function generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Send verification email
exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
    const { email, type } = data; // type: 'signup', 'password_reset', 'email_change'
    
    try {
        const code = generateVerificationCode();
        
        // Firestore එකේ code එක save කරන්න (10 minutes expire)
        await admin.firestore().collection('verification_codes').doc(email).set({
            code: code,
            type: type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
            verified: false
        });
        
        // Email template type අනුව
        let subject, html;
        
        if (type === 'signup') {
            subject = 'KaliyaX API - Email Verification';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 40px; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; font-weight: bold; color: white; margin-bottom: 20px;">K</div>
                            <h1 style="color: #667eea; margin: 0; font-size: 28px;">Welcome to KaliyaX API! 🎉</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.6;">
                            Thank you for signing up! Please verify your email address by entering the code below:
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #667eea;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</div>
                            <div style="color: #667eea; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                        </div>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                ⏰ This code will expire in <strong>10 minutes</strong>
                            </p>
                        </div>
                        
                        <p style="font-size: 14px; color: #666; margin-top: 30px; line-height: 1.6;">
                            If you didn't create an account with KaliyaX API, please ignore this email.
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <div style="text-align: center;">
                            <p style="font-size: 12px; color: #999; margin: 0;">
                                © 2025 KaliyaX API. All rights reserved.<br>
                                <a href="https://kaliyax.com" style="color: #667eea; text-decoration: none;">Visit our website</a> | 
                                <a href="https://docs.kaliyax.com" style="color: #667eea; text-decoration: none;">Documentation</a>
                            </p>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'password_reset') {
            subject = 'KaliyaX API - Password Reset';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 40px; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; margin-bottom: 20px;">🔐</div>
                            <h1 style="color: #667eea; margin: 0; font-size: 28px;">Password Reset Request</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.6;">
                            We received a request to reset your password. Use the code below to continue:
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #667eea;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Reset Code</div>
                            <div style="color: #667eea; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                        </div>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                ⏰ This code will expire in <strong>10 minutes</strong>
                            </p>
                        </div>
                        
                        <div style="background: #f8d7da; border-left: 4px solid #dc3545; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #721c24; font-size: 14px;">
                                ⚠️ If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <div style="text-align: center;">
                            <p style="font-size: 12px; color: #999; margin: 0;">
                                © 2025 KaliyaX API. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'email_change') {
            subject = 'KaliyaX API - Email Change Verification';
            html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
                    <div style="background: white; padding: 40px; border-radius: 10px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 40px; margin-bottom: 20px;">📧</div>
                            <h1 style="color: #667eea; margin: 0; font-size: 28px;">Verify Your New Email</h1>
                        </div>
                        
                        <p style="font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.6;">
                            Please verify your new email address by entering the code below:
                        </p>
                        
                        <div style="background: #f8f9fa; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; border: 2px dashed #667eea;">
                            <div style="font-size: 14px; color: #666; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; font-weight: 600;">Verification Code</div>
                            <div style="color: #667eea; font-size: 48px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">${code}</div>
                        </div>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                ⏰ This code will expire in <strong>10 minutes</strong>
                            </p>
                        </div>
                        
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        
                        <div style="text-align: center;">
                            <p style="font-size: 12px; color: #999; margin: 0;">
                                © 2025 KaliyaX API. All rights reserved.
                            </p>
                        </div>
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
        
        // Mark as verified
        await doc.ref.update({ verified: true });
        
        return { success: true, verified: true };
    } catch (error) {
        throw error;
    }
});

// Cleanup expired codes (runs every hour)
exports.cleanupExpiredCodes = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const snapshot = await admin.firestore().collection('verification_codes')
        .where('expiresAt', '<', now)
        .get();
    
    const batch = admin.firestore().batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`Cleaned up ${snapshot.size} expired verification codes`);
    return null;
});
