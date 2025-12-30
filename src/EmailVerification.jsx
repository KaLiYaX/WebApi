// FILE: src/EmailVerification.jsx - Email Verification Component

const { useState, useEffect, useRef } = React;

function EmailVerification({ email, onVerified, onBack, type = 'signup' }) {
    const [code, setCode] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        inputRefs[0].current?.focus();
    }, []);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        if (value.length > 1) value = value[0];

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-verify when all 4 digits entered
        if (index === 3 && value) {
            const fullCode = newCode.join('');
            if (fullCode.length === 4) {
                verifyCode(fullCode);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace') {
            if (!code[index] && index > 0) {
                inputRefs[index - 1].current?.focus();
            } else {
                const newCode = [...code];
                newCode[index] = '';
                setCode(newCode);
            }
        } else if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs[index - 1].current?.focus();
        } else if (e.key === 'ArrowRight' && index < 3) {
            inputRefs[index + 1].current?.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
        const newCode = pastedData.split('');
        
        while (newCode.length < 4) {
            newCode.push('');
        }
        
        setCode(newCode);
        
        const lastIndex = Math.min(pastedData.length - 1, 3);
        inputRefs[lastIndex].current?.focus();
        
        if (newCode.join('').length === 4) {
            verifyCode(newCode.join(''));
        }
    };

    const verifyCode = async (fullCode) => {
        setLoading(true);
        setError('');

        try {
            // Use EmailService to verify
            const result = await window.emailService.verifyCode(email, fullCode);

            if (result.success && result.verified) {
                await window.emailService.deleteVerificationCode(email);
                onVerified();
            } else {
                setError(result.message || 'Invalid verification code');
                setCode(['', '', '', '']);
                inputRefs[0].current?.focus();
            }
        } catch (err) {
            console.error('Verification error:', err);
            setError('Verification failed. Please try again.');
            setCode(['', '', '', '']);
            inputRefs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        if (countdown > 0) return;
        
        setResending(true);
        setError('');

        try {
            // Use EmailService to resend
            const result = await window.emailService.sendVerificationEmail(email, type);
            
            if (result.success) {
                setCountdown(60);
                alert('✅ New verification code sent!');
            } else {
                setError(result.message || 'Failed to resend code');
            }
        } catch (err) {
            setError('Failed to resend code. Please try again.');
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMTIxMjEiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJWMGgydjMwem0wIDMwdi0yaDJWNjBoLTJ6TTAgMzZoMzB2Mkgwdi0yem0zMCAwaDMwdjJIMzB2LTJ6Ij48L3BhdGg+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>

            <div className="relative z-10 w-full max-w-md">
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl animate-fade-in">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Verify Your Email</h2>
                        <p className="text-slate-400 text-sm">
                            We sent a 4-digit code to<br/>
                            <span className="text-purple-400 font-semibold">{email}</span>
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center animate-fade-in flex items-center justify-center space-x-2">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="mb-8">
                        <div className="flex justify-center space-x-3">
                            {code.map((digit, index) => (
                                <input
                                    key={index}
                                    ref={inputRefs[index]}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength="1"
                                    value={digit}
                                    onChange={(e) => handleChange(index, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(index, e)}
                                    onPaste={handlePaste}
                                    className="w-14 h-14 sm:w-16 sm:h-16 text-center text-2xl sm:text-3xl font-bold bg-slate-800/50 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
                                    disabled={loading}
                                />
                            ))}
                        </div>
                    </div>

                    {loading && (
                        <div className="mb-6 text-center">
                            <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-slate-400 text-sm mt-2">Verifying...</p>
                        </div>
                    )}

                    <div className="text-center space-y-4">
                        <button
                            onClick={resendCode}
                            disabled={resending || loading || countdown > 0}
                            className="text-purple-400 hover:text-purple-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                        >
                            {resending ? 'Sending...' : countdown > 0 ? `Resend in ${countdown}s` : "Didn't receive code? Resend"}
                        </button>

                        <button
                            onClick={onBack}
                            className="block w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors font-semibold"
                            disabled={loading}
                        >
                            Back
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                            <div>
                                <p className="text-blue-400 text-xs font-semibold mb-1">💡 Tips:</p>
                                <ul className="text-blue-300 text-xs space-y-1">
                                    <li>• Code expires in 10 minutes</li>
                                    <li>• Check your spam folder</li>
                                    <li>• You can paste the code</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
