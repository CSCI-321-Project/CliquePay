import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, AlertCircle, CheckCircle, Eye, EyeOff, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PageLayout, Header, Section } from "../components/layout/PageLayout";
import { SecurityUtils } from '../utils/Security';
export default function ForgotPassword() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState(null);
    const API_URL = `${import.meta.env.VITE_API_URL}/api` || 'http://127.0.0.1:8000/api';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            const request = await fetch(`${API_URL}/reset-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });
            
            const data = await request.json();
            if (request.ok) {
                setEmailSent(true);
                setShowVerification(true); // Show verification code input
            } else {
                setError(data.message || 'Failed to send reset link');
            }
        }
        catch (error) {
            setError('Failed to send reset link');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handler for verification code submission
    const handleVerificationSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validate passwords
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            setIsSubmitting(false);
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long");
            setIsSubmitting(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/confirm-reset-password/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    email, 
                    confirmation_code: verificationCode,
                    new_password: password
                }),
            });
            
            const data = await response.json();
            if (response.ok) {
                // Navigate to login page with success message
                navigate('/login', { state: { message: 'Password reset successfully! You can now login with your new password.' } });
            } else {
                setError(data.message || 'Invalid verification code');
            }
        } catch (error) {
            setError('Failed to verify code');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle individual digit input change
    const handleDigitChange = (index, value) => {
        if (value === '' || /^[0-9]$/.test(value)) {
            const newCode = verificationCode.split('');
            newCode[index] = value;
            setVerificationCode(newCode.join(''));
            
            // Auto-focus next input - updated to check for index < 5 for 6 digits
            if (value !== '' && index < 5) {
                const nextInput = document.getElementById(`digit-${index + 1}`);
                if (nextInput) nextInput.focus();
            }
        }
    };

    return (
        <PageLayout>
            <Header>
                <div className="flex items-center gap-2">
                    <div className="bg-purple-600 w-8 h-8 rounded-md flex items-center justify-center">
                        <img 
                            src="/images/Watchtower-no-words.png" 
                            alt="WatchTower Logo" 
                            className="h-6" 
                        />
                    </div>
                    <span className="font-bold text-xl">CliquePay</span>
                </div>
                <div className="flex gap-4">
                    <Button 
                        variant="outline"
                        onClick={() => navigate('/login')}
                        className="text-white hover:bg-zinc-800"
                    >
                        Back to Login
                    </Button>
                </div>
            </Header>

            <Section 
                className="flex items-center justify-center min-h-[calc(100vh-200px)] py-8 relative overflow-hidden"
                style={{
                    background: "linear-gradient(to bottom, #0c0613 0%, #1a0b2e 50%, #130a1f 100%)"
                }}
            >
                {/* Background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/0 via-purple-800/10 to-purple-600/0 blur-3xl opacity-70"></div>
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-900/30 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/30 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl -z-10"></div>
                    <div className="absolute bottom-1/4 left-1/3 w-48 h-48 bg-indigo-600/20 rounded-full blur-3xl -z-10"></div>
                </div>

                {/* Main content */}
                <div className="relative z-10 w-full max-w-md mx-auto">
                    <div className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-8 shadow-xl">
                        {!emailSent ? (
                            <>
                                <div className="text-center mb-6">
                                    <h1 className="text-2xl font-bold text-white mb-2">Reset Your Password</h1>
                                    <p className="text-gray-400">
                                        Enter the email address associated with your account, and we'll send you a verification code.
                                    </p>
                                </div>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-red-300 text-sm">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div className="mb-6">
                                        <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                            Email Address
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                placeholder="name@example.com"
                                                required
                                            />
                                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center">
                                                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                                Processing...
                                            </span>
                                        ) : (
                                            "Send Verification Code"
                                        )}
                                    </Button>
                                </form>
                            </>
                        ) : showVerification ? (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-6">
                                    <Mail className="h-8 w-8 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Reset Your Password</h2>
                                <p className="text-gray-400 mb-6">
                                    Enter the verification code sent to <span className="text-purple-400 font-medium">{email}</span> and your new password
                                </p>

                                {error && (
                                    <div className="mb-6 p-3 bg-red-900/30 border border-red-700 rounded-lg flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-red-300 text-sm">{error}</p>
                                    </div>
                                )}

                                <form onSubmit={handleVerificationSubmit}>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-300 mb-4">
                                            Verification Code
                                        </label>
                                        <div className="flex justify-center gap-2">
                                            {[0, 1, 2, 3, 4, 5].map((index) => ( // Changed to include 6 digits (0-5)
                                                <input
                                                    key={index}
                                                    id={`digit-${index}`}
                                                    type="text"
                                                    maxLength="1"
                                                    value={verificationCode[index] || ''}
                                                    onChange={(e) => handleDigitChange(index, e.target.value)}
                                                    className="flex h-14 w-12 rounded-md border border-zinc-700 bg-zinc-800 text-center text-lg font-bold text-white focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                                                    required
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* New Password Field */}
                                    <div className="mb-6">
                                        <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                            New Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                placeholder="Enter new password"
                                                required
                                                minLength={8}
                                            />
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-300"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="mt-1 text-xs text-zinc-400">
                                            Must be at least 8 characters long
                                        </p>
                                    </div>

                                    {/* Confirm Password Field */}
                                    <div className="mb-6">
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                id="confirmPassword"
                                                type={showConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                                placeholder="Confirm new password"
                                                required
                                            />
                                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-zinc-400" />
                                            <button
                                                type="button"
                                                className="absolute right-3 top-2.5 text-zinc-400 hover:text-zinc-300"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || verificationCode.length !== 6} // Changed from 5 to 6
                                        className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2"
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center justify-center">
                                                <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                                Resetting Password...
                                            </span>
                                        ) : (
                                            "Reset Password"
                                        )}
                                    </Button>
                                </form>

                                <p className="mt-6 text-sm text-gray-400">
                                    Didn't receive the code?{" "}
                                    <button 
                                        className="text-purple-400 hover:text-purple-300 underline"
                                        onClick={() => {
                                            setIsSubmitting(true);
                                            setTimeout(() => {
                                                setIsSubmitting(false);
                                            }, 1500);
                                        }}
                                    >
                                        Resend code
                                    </button>
                                </p>
                            </div>
                        ) : (
                            <div className="text-center">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-6">
                                    <Mail className="h-8 w-8 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
                                <p className="text-gray-400 mb-6">
                                    We've sent a verification code to <span className="text-purple-400 font-medium">{email}</span>
                                </p>
                                <div className="flex flex-col gap-4">
                                    <Button 
                                        onClick={() => {
                                            setEmailSent(false);
                                            setEmail('');
                                        }}
                                        className="bg-zinc-800 hover:bg-zinc-700 text-white"
                                    >
                                        Use a different email
                                    </Button>
                                    <Button 
                                        onClick={() => navigate('/login')}
                                        className="bg-purple-600 hover:bg-purple-700 text-white"
                                    >
                                        Back to Login
                                    </Button>
                                </div>
                                <p className="mt-6 text-sm text-gray-400">
                                    Didn't receive the email? Check your spam folder or{" "}
                                    <button 
                                        className="text-purple-400 hover:text-purple-300 underline"
                                        onClick={() => {
                                            setIsSubmitting(true);
                                            setTimeout(() => {
                                                setIsSubmitting(false);
                                            }, 1500);
                                        }}
                                    >
                                        try again
                                    </button>
                                </p>
                            </div>
                        )}

                        <div className="mt-8 text-center">
                            <button 
                                onClick={() => navigate('/login')}
                                className="text-sm text-gray-400 hover:text-white flex items-center justify-center mx-auto"
                            >
                                <ArrowLeft className="w-4 h-4 mr-1" /> Back to login
                            </button>
                        </div>
                    </div>
                </div>
            </Section>
        </PageLayout>
    );
}