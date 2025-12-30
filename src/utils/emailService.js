// FILE: src/utils/emailService.js
// Direct Email Service using EmailJS (No Firebase Functions)

class EmailService {
    constructor() {
        this.initialized = false;
    }

    // Initialize EmailJS
    init() {
        if (!this.initialized && window.emailJSConfig && window.emailJSConfig.publicKey) {
            try {
                emailjs.init(window.emailJSConfig.publicKey);
                this.initialized = true;
                console.log('✅ EmailJS initialized successfully');
            } catch (error) {
                console.error('❌ EmailJS initialization failed:', error);
            }
        } else if (!window.emailJSConfig || !window.emailJSConfig.publicKey) {
            console.warn('⚠️ EmailJS config missing. Update firebase.js with your EmailJS credentials.');
        }
    }

    // Generate 4-digit verification code
    generateCode() {
        return Math.floor(1000 + Math.random() * 9000).toString();
    }

    // Save verification code to Firestore
    async saveVerificationCode(email, code, type) {
        try {
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes

            await window.firebaseDB.collection('verification_codes').doc(email).set({
                code: code,
                type: type,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
                verified: false
            });

            console.log(`✅ Verification code saved for ${email}: ${code}`);
            return true;
        } catch (error) {
            console.error('❌ Error saving verification code:', error);
            return false;
        }
    }

    // Send verification email using EmailJS
    async sendVerificationEmail(email, type = 'signup') {
        try {
            this.init();

            if (!this.initialized) {
                throw new Error('EmailJS not initialized. Check your configuration in firebase.js');
            }

            const code = this.generateCode();
            
            // Save code to Firestore first
            const saved = await this.saveVerificationCode(email, code, type);
            if (!saved) {
                throw new Error('Failed to save verification code to database');
            }

            // Prepare email parameters
            const templateParams = {
                to_email: email,
                code: code,
                type: type,
                expires_in: '10 minutes',
                subject: type === 'signup' 
                    ? '🎉 KaliyaX API - Email Verification' 
                    : '🔐 KaliyaX API - Password Reset'
            };

            console.log('📧 Sending email to:', email);

            // Send email via EmailJS
            const response = await emailjs.send(
                window.emailJSConfig.serviceId,
                window.emailJSConfig.templateId,
                templateParams
            );

            console.log('✅ Email sent successfully:', response);
            
            return {
                success: true,
                message: 'Verification code sent to your email!'
            };

        } catch (error) {
            console.error('❌ Email send error:', error);
            
            let errorMessage = 'Failed to send email. ';
            
            if (error.message.includes('not initialized')) {
                errorMessage += 'EmailJS configuration is missing. Check firebase.js file.';
            } else if (error.text) {
                errorMessage += error.text;
            } else {
                errorMessage += 'Please check your EmailJS configuration and try again.';
            }
            
            return {
                success: false,
                message: errorMessage
            };
        }
    }

    // Verify code
    async verifyCode(email, code) {
        try {
            const doc = await window.firebaseDB
                .collection('verification_codes')
                .doc(email)
                .get();

            if (!doc.exists) {
                return {
                    success: false,
                    message: 'Verification code not found. Please request a new code.'
                };
            }

            const data = doc.data();
            const now = new Date();
            const expiresAt = data.expiresAt.toDate();

            // Check if expired
            if (now > expiresAt) {
                await doc.ref.delete();
                return {
                    success: false,
                    message: 'Verification code expired. Please request a new code.'
                };
            }

            // Check if code matches
            if (data.code !== code) {
                return {
                    success: false,
                    message: 'Invalid verification code. Please check and try again.'
                };
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
            console.error('❌ Verification error:', error);
            return {
                success: false,
                message: 'Verification failed. Please try again.'
            };
        }
    }

    // Delete verification code
    async deleteVerificationCode(email) {
        try {
            await window.firebaseDB
                .collection('verification_codes')
                .doc(email)
                .delete();
            console.log(`✅ Verification code deleted for ${email}`);
        } catch (error) {
            console.error('❌ Error deleting verification code:', error);
        }
    }

    // Test email function
    async testEmail(email) {
        try {
            this.init();
            
            if (!this.initialized) {
                return {
                    success: false,
                    message: 'EmailJS not configured'
                };
            }

            await emailjs.send(
                window.emailJSConfig.serviceId,
                window.emailJSConfig.templateId,
                {
                    to_email: email,
                    code: '1234',
                    expires_in: '10 minutes',
                    subject: 'Test Email'
                }
            );

            return {
                success: true,
                message: 'Test email sent successfully!'
            };
        } catch (error) {
            console.error('Test email error:', error);
            return {
                success: false,
                message: error.message || 'Failed to send test email'
            };
        }
    }
}

// Create global instance
window.emailService = new EmailService();

console.log('✅ Email Service loaded');
