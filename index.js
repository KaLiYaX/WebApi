// FILE: index.js (Root Level - Firebase Functions)
// මේකෙන් Firebase Functions run වෙනවා

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// ⚠️ IMPORTANT: මෙතන ඔයාගේ Gmail credentials දාන්න
// Gmail App Password generate කරන්න: https://myaccount.google.com/apppasswords
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'kaliya.x.git@gmail.com', // ඔයාගේ Gmail address මෙතන
        pass: 'kndodvifzrsovrkx' // Gmail App Password (16 characters) මෙතන
    }
});

// Test email configuration
transporter.verify(function(error, success) {
    if (error) {
        console.log('❌ Email configuration error:', error);
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Generate 4-digit verification code
function generateVerificationCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Send verification email
exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
    const { email, type } = data;
    
    console.log(`📧 Sending ${type} verification email to: ${email}`);
    
    try {
        const code = generateVerificationCode();
        
        // Save verification code to Firestore (expires in 10 minutes)
        await admin.firestore().collection('verification_codes').doc(email).set({
            code: code,
            type: type,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
            verified: false
        });
        
        console.log(`✅ Verification code saved for ${email}: ${code}`);
        
        // Email templates based on type
        let subject, html;
        
        if (type === 'signup') {
            subject = 'KaliyaX API - Email Verification 🎉';
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
            subject = 'KaliyaX API - Password Reset 🔐';
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
            subject = 'KaliyaX API - Email Change Verification 📧';
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
        
        // Send email using nodemailer
        const mailOptions = {
            from: `"KaliyaX API" <${transporter.options.auth.user}>`,
            to: email,
            subject: subject,
            html: html
        };
        
        await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email sent successfully to ${email}`);
        
        return { 
            success: true, 
            message: 'Verification code sent successfully!' 
        };
        
    } catch (error) {
        console.error('❌ Error in sendVerificationEmail:', error);
        throw new functions.https.HttpsError(
            'internal', 
            `Failed to send verification email: ${error.message}`
        );
    }
});

// Verify code
exports.verifyCode = functions.https.onCall(async (data, context) => {
    const { email, code } = data;
    
    console.log(`🔍 Verifying code for email: ${email}`);
    
    try {
        const doc = await admin.firestore()
            .collection('verification_codes')
            .doc(email)
            .get();
        
        if (!doc.exists) {
            console.log(`❌ Verification code not found for ${email}`);
            throw new functions.https.HttpsError(
                'not-found', 
                'Verification code not found. Please request a new code.'
            );
        }
        
        const data = doc.data();
        const now = admin.firestore.Timestamp.now();
        
        // Check if code has expired
        if (now.toMillis() > data.expiresAt.toMillis()) {
            console.log(`⏰ Verification code expired for ${email}`);
            await doc.ref.delete();
            throw new functions.https.HttpsError(
                'deadline-exceeded', 
                'Verification code has expired. Please request a new code.'
            );
        }
        
        // Check if code matches
        if (data.code !== code) {
            console.log(`❌ Invalid code entered for ${email}`);
            throw new functions.https.HttpsError(
                'invalid-argument', 
                'Invalid verification code. Please check and try again.'
            );
        }
        
        // Mark as verified
        await doc.ref.update({ verified: true });
        
        console.log(`✅ Code verified successfully for ${email}`);
        
        return { 
            success: true, 
            verified: true,
            message: 'Email verified successfully!'
        };
        
    } catch (error) {
        console.error('❌ Error in verifyCode:', error);
        throw error;
    }
});

// Cleanup expired verification codes (scheduled function - runs every hour)
exports.cleanupExpiredCodes = functions.pubsub
    .schedule('every 1 hours')
    .onRun(async (context) => {
        console.log('🧹 Starting cleanup of expired verification codes...');
        
        const now = admin.firestore.Timestamp.now();
        
        try {
            const snapshot = await admin.firestore()
                .collection('verification_codes')
                .where('expiresAt', '<', now)
                .get();
            
            if (snapshot.empty) {
                console.log('✅ No expired codes to clean up');
                return null;
            }
            
            const batch = admin.firestore().batch();
            
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            
            console.log(`✅ Cleaned up ${snapshot.size} expired verification codes`);
            
        } catch (error) {
            console.error('❌ Error during cleanup:', error);
        }
        
        return null;
    });

// Test function (for debugging)
exports.testFunction = functions.https.onCall(async (data, context) => {
    console.log('🧪 Test function called');
    return { 
        success: true, 
        message: 'Firebase Functions are working correctly!',
        timestamp: new Date().toISOString()
    };
});
