// src/pages/MFACaesarPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MFACaesarPage() {
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

  const cipher = challengeParams?.ciphertext || '';

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const next = await respondToChallenge(answer);
      if (next) {
        setError('Incorrect decryption.');
      } else {
        navigate('/customer-home');
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Decryption Challenge</h2>
        <pre>{cipher}</pre>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Decrypt here"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Submit'}
          </button>
        </form>
      </div>
    </>
  );
}
