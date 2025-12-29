// FILE: src/ConfirmDialog.jsx
// Confirm Dialog Component

const { useState, useEffect } = React;

function ConfirmDialog() {
    const [dialog, setDialog] = useState(null);

    useEffect(() => {
        // Global function to show confirm dialog
        window.showConfirm = ({ title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
            return new Promise((resolve) => {
                setDialog({
                    title,
                    message,
                    confirmText,
                    cancelText,
                    type,
                    onConfirm: () => {
                        setDialog(null);
                        resolve(true);
                    },
                    onCancel: () => {
                        setDialog(null);
                        resolve(false);
                    }
                });
            });
        };
    }, []);

    if (!dialog) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fade-in" onClick={dialog.onCancel}>
            <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 max-w-md w-full shadow-2xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start space-x-4 mb-4">
                    <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                        dialog.type === 'warning' ? 'bg-yellow-500/20' : 
                        dialog.type === 'danger' ? 'bg-red-500/20' : 
                        'bg-blue-500/20'
                    }`}>
                        {dialog.type === 'warning' && (
                            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                        {dialog.type === 'danger' && (
                            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                        {dialog.type === 'info' && (
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-1">{dialog.title}</h3>
                        <p className="text-slate-400 text-sm">{dialog.message}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                    <button
                        onClick={dialog.onCancel}
                        className="flex-1 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        {dialog.cancelText}
                    </button>
                    <button
                        onClick={dialog.onConfirm}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-colors ${
                            dialog.type === 'danger'
                                ? 'bg-red-600 hover:bg-red-700 text-white'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                    >
                        {dialog.confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
