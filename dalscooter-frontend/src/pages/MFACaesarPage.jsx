import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/MFACaesarPage.css';

export default function MFACaesarPage() {
  const navigate = useNavigate();
  const { respondChallenge, challengeParams, clearChallengeParams, user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('pendingRole');
    console.log('MFA Caesar page loaded, stored role:', storedRole);

    if (!challengeParams || challengeParams.challenge_type !== 'CAESAR') {
      if (!hasNavigated) {
        console.log('Invalid challenge, redirecting to login');
        clearChallengeParams();
        localStorage.removeItem('pendingRole');
        navigate('/login', { replace: true });
      }
    }
  }, [challengeParams, navigate, hasNavigated, clearChallengeParams]);

  const cipher = challengeParams?.ciphertext || '';

  const validateUserRole = async () => {
    try {
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Validating user role, user data:', userData);
      if (userData.idToken) {
        const parts = userData.idToken.split('.');
        if (parts.length === 3) {
          let payload = parts[1];
          payload = payload.replace(/-/g, '+').replace(/_/g, '/');
          while (payload.length % 4) {
            payload += '=';
          }
          
          const decodedPayload = JSON.parse(atob(payload));
          console.log('User groups from token:', decodedPayload['cognito:groups']);
          console.log('User custom role from token:', decodedPayload['custom:role']);
          
          if (Array.isArray(decodedPayload['cognito:groups']) && decodedPayload['cognito:groups'].includes('FranchiseOperator')) {
            return 'FranchiseOperator';
          } else if (decodedPayload['custom:role'] === 'FranchiseOperator') {
            return 'FranchiseOperator';
          }
        } else {
          console.warn('Invalid idToken format:', parts);
        }
      } else {
        console.warn('No idToken in user data');
      }
      return 'RegisteredCustomer';
    } catch (error) {
      console.error('Error validating user role:', error);
      return 'RegisteredCustomer';
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await respondChallenge({ answer });
      console.log('Caesar Challenge result:', result);
      
      if (result && result.success) {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        const storedRole = localStorage.getItem('pendingRole');
        const selectedRole = result.role || storedRole || urlRole || 'RegisteredCustomer';
        
        console.log('Selected role:', selectedRole);
        console.log('URL role:', urlRole, 'Stored role:', storedRole, 'Result role:', result.role);
        
        const actualUserRole = await validateUserRole();
        console.log('Actual user role:', actualUserRole);
        
        if (selectedRole === 'FranchiseOperator' && actualUserRole !== 'FranchiseOperator') {
          setError('Access denied. You are not authorized as a Franchise Operator.');
          localStorage.removeItem('pendingRole');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          setLoading(false);
          return;
        }
        
        if (selectedRole === 'RegisteredCustomer' && actualUserRole === 'FranchiseOperator') {
          setError('You are a Franchise Operator. Please login again and select "Franchise Owner".');
          localStorage.removeItem('pendingRole');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          setLoading(false);
          return;
        }
        
        setHasNavigated(true);
        localStorage.removeItem('pendingRole');
        if (selectedRole === 'FranchiseOperator') {
          navigate('/franchise-dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      } else {
        setError('Incorrect decryption. Redirecting to login...');
        setHasNavigated(true);
        setTimeout(() => {
          clearChallengeParams();
          localStorage.removeItem('pendingRole');
          navigate('/login', { replace: true });
        }, 5000);
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed. Redirecting to login...');
      setHasNavigated(true);
      setTimeout(() => {
        clearChallengeParams();
        localStorage.removeItem('pendingRole');
        navigate('/login', { replace: true });
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mfa-caesar-container">
        <h2 className="mfa-caesar-title">Decryption Challenge</h2>
        <p className="mfa-caesar-text">Decrypt the following cipher:</p>
        <pre className="mfa-caesar-cipher">{cipher}</pre>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="mfa-caesar-form">
          <input
            type="text"
            placeholder="Your Answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            className="mfa-caesar-input"
            required
          />
          <button
            type="submit"
            className="mfa-caesar-button"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Submit'}
          </button>
        </form>
      </div>
    </>
  );
}