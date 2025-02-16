import React, { useState, useEffect } from 'react';
import Button from '../components/button';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
 
function Verify() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  useEffect(() => {
    const username = Cookies.get('username');
    if (username) {
      setUsername(username);
    } else {
      navigate('/signup');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://127.0.0.1:8000/api/verify/', {
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
        //navigate('/login');
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

  return (
    <div className="min-h-screen bg-blue-600 text-white flex items-center justify-center">
      <div className="bg-white text-black p-8 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4 text-center">Verify</h2>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={username}
              className="w-full bg-gray-300 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled
            />
          </div>
          <div>
            <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              type="text"
              id="verificationCode"
              name="verificationCode"
              placeholder="Enter verification code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <Button
            className="w-full mt-4"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <p>Didn't get the email? <a>Resend code</a></p>
        </form>
      </div>
    </div>
  );
}

export default Verify;
