import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MFAQuestionPage() {
  const navigate = useNavigate();
  const { respondChallenge, challengeParams, clearChallengeParams } = useAuth();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect if no valid challenge
  useEffect(() => {
    if (!challengeParams || challengeParams.challenge_type !== 'QA') {
      navigate('/login');
    }
  }, [challengeParams, navigate]);

  const question = challengeParams?.question || '';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const next = await respondChallenge({ answer });

      if (next === 'CAESAR') {
        navigate('/mfa-caesar');
      } else if (next === null) {
        navigate('/customer-home');
      } else {
        setError('Unexpected challenge step. Redirecting to login...');
        clearChallengeParams();
        setTimeout(() => navigate('/login'), 5000);
      }
    } catch (err) {
      console.error(err);
      setError('Incorrect answer. Redirecting to login...');
      clearChallengeParams();
      setTimeout(() => navigate('/login'), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto bg-white shadow-md rounded p-6">
        <h2 className="text-2xl font-bold mb-4">Security Question</h2>
        <p className="mb-4 text-gray-700">{question}</p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full p-2 border border-gray-300 rounded"
            placeholder="Your Answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </>
  );
}
