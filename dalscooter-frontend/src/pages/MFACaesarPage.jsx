import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MFACaesarPage() {
  const navigate = useNavigate();
  const { respondChallenge, challengeParams, clearChallengeParams } = useAuth();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!challengeParams || challengeParams.challenge_type !== 'CAESAR') {
      clearChallengeParams();
      navigate('/login');
    }
  }, [challengeParams, navigate, clearChallengeParams]);

  const cipher = challengeParams?.ciphertext || '';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const next = await respondChallenge({ answer });
      console.log('Challenge response:', next);
      if (next === null) {
        navigate('/customer-home');
      } else {
        setError('Incorrect decryption. Redirecting to login...');
        setTimeout(() => {
          clearChallengeParams ()
          navigate('/Home')
        },
         5000);
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed. Redirecting to login...');
      setTimeout(() =>{
        clearChallengeParams();
        navigate('/login');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container max-w-md mx-auto bg-white shadow-md rounded p-6">
        <h2 className="text-2xl font-bold mb-4">Decryption Challenge</h2>
        <p className="text-gray-600 mb-2">Decrypt the following cipher:</p>
        <pre className="bg-gray-100 p-3 rounded text-sm mb-4">{cipher}</pre>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Your Answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Submit'}
          </button>
        </form>
      </div>
    </>
  );
}
