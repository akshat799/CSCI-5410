// src/pages/MFAQuestionPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MFAQuestionPage() {
  const navigate = useNavigate();
  const { respondToChallenge, challengeParams } = useAuth();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!challengeParams) {
      navigate('/login');
    }
  }, [challengeParams, navigate]);

  const question = challengeParams?.question || '';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const next = await respondToChallenge(answer);
      if (next === 'CUSTOM_CHALLENGE') {
        navigate('/mfa-caesar');
      } else {
        navigate('/customer-home');
      }
    } catch (err) {
      console.error(err);
      setError('Incorrect answer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Security Question</h2>
        <p>{question}</p>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Your Answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </>
  );
}
