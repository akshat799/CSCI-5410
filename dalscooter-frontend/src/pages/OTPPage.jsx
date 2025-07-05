// src/pages/OTPPage.jsx
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function OTPPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const prefill = location.state?.email || '';
  const { confirmSignUp, resendConfirmationCode } = useAuth();
  const [email, setEmail] = useState(prefill);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await confirmSignUp({ username: email.toLowerCase().trim(), code });
      navigate('/login', { replace: true });
    } catch (err) {
      console.error(err);
      setError(err.message || 'Confirmation failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await resendConfirmationCode(email.toLowerCase().trim());
      alert('Code resent!');
    } catch {
      alert('Failed to resend code.');
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Confirm Your Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Confirmation Code
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Confirming…' : 'Confirm'}
          </button>
        </form>
        <button onClick={handleResend}>Resend Code</button>
      </div>
    </>
  );
}
