function EmailVerification({ email, onVerified, onBack, type = 'signup' }) {
    const [code, setCode] = useState(['', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [resending, setResending] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    useEffect(() => {
        inputRefs[0].current?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only numbers
        if (value.length > 1) value = value[0];

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        if (index === 3 && value) {
            const fullCode = newCode.join('');
            if (fullCode.length === 4) {
                verifyCode(fullCode);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
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
        
        if (newCode.join('').length === 4) {
            verifyCode(newCode.join(''));
        }
    };

    const verifyCode = async (fullCode) => {
        setLoading(true);
        setError('');

        try {
            const verifyFunction = window.firebaseFunctions.httpsCallable('verifyCode');
            const result = await verifyFunction({ email, code: fullCode });

            if (result.data.verified) {
                onVerified();
            } else {
                setError('Invalid verification code');
                setCode(['', '', '', '']);
                inputRefs[0].current?.focus();
            }
        } catch (err) {
            console.error('Verification error:', err);
            if (err.code === 'deadline-exceeded') {
                setError('Code expired. Please request a new one.');
            } else if (err.code === 'invalid-argument') {
                setError('Invalid verification code');
            } else {
                setError('Verification failed. Please try again.');
            }
            setCode(['', '', '', '']);
            inputRefs[0].current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const resendCode = async () => {
        setResending(true);
        setError('');

        try {
            const sendEmailFunction = window.firebaseFunctions.httpsCallable('sendVerificationEmail');
            await sendEmailFunction({ email, type });
            alert('✅ New verification code sent!');
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
                <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl">
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
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center animate-fade-in">
                            {error}
                        </div>
                    )}

                    <div className="mb-8">
                        <div className="flex justify-center space-x-4">
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
                                    className="w-16 h-16 text-center text-3xl font-bold bg-slate-800/50 border-2 border-slate-700 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
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
                            disabled={resending || loading}
                            className="text-purple-400 hover:text-purple-300 text-sm disabled:opacity-50 transition-colors"
                        >
                            {resending ? 'Sending...' : "Didn't receive code? Resend"}
                        </button>

                        <button
                            onClick={onBack}
                            className="block w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
                            disabled={loading}
                        >
                            Back
                        </button>
                    </div>

                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-blue-400 text-xs text-center">
                            💡 Code expires in 10 minutes
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
