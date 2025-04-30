import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { PageLayout, Header, Section } from "../components/layout/PageLayout";

function Verify() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
     setUsername(Cookies.get('username'));
    if (!Cookies.get('username')) {
      navigate('/signup');
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username,
          confirmation_code: verificationCode,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Verification successful
        console.log('Verification successful:', data);
        Cookies.remove('username');
        navigate('/login');
      } else {
        // Verification failed
        console.error('Verification failed:', data);
        setError(data.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      console.error('An error occurred:', err);
      setError('Cannot connect to server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/resend-code/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Resend code successful
        // Using more subtle notification instead of alert
        setError({
          type: 'success',
          message: 'Verification code resent successfully. Please check your email.'
        });
      } else {
        // Resend code failed
        setError(data.message || 'Failed to resend verification code. Please try again.');
      }
    } catch (err) {
      console.error('An error occurred while resending the code:', err);
      setError('Cannot connect to server. Please try again.');
    } 
  };

  // Handle individual digit input change
  const handleDigitChange = (index, value) => {
    if (value === '' || /^[0-9]$/.test(value)) {
      const newCode = verificationCode.split('');
      newCode[index] = value;
      const updatedCode = newCode.join('');
      setVerificationCode(updatedCode);
      
      // Auto-focus next input
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
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-600/20 mb-6">
                <Mail className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Verify Your Account</h2>
              <p className="text-gray-400 mb-6">
                We've sent a verification code to your email. Please enter it below.
              </p>

              {error && (
                <div className={`mb-6 p-3 ${error.type === 'success' ? 'bg-green-900/30 border-green-700' : 'bg-red-900/30 border-red-700'} border rounded-lg flex items-start gap-3`}>
                  {error.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  )}
                  <p className={`${error.type === 'success' ? 'text-green-300' : 'text-red-300'} text-sm`}>
                    {error.type === 'success' ? error.message : error}
                  </p>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                    Username
                  </label>
                  <input
                    type="text" 
                    id="username"
                    name="username"
                    value={username}
                    className="flex h-10 w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                    disabled
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Verification Code
                  </label>
                  <div className="flex justify-center gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
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
                
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <span className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                      Verifying...
                    </span>
                  ) : (
                    "Verify Account"
                  )}
                </Button>
              </form>

              <p className="mt-6 text-sm text-gray-400">
                Didn't receive the code?{" "}
                <button 
                  className="text-purple-400 hover:text-purple-300 underline"
                  onClick={handleResendCode}
                  disabled={isLoading}
                >
                  Resend code
                </button>
              </p>
            </div>

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

export default Verify;
