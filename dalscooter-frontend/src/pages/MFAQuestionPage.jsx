import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/MFAQuestionPage.css';

export default function MFAQuestionPage() {
  const navigate = useNavigate();
  const { respondChallenge, challengeParams, clearChallengeParams, user } = useAuth();
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const storedRole = localStorage.getItem('pendingRole');
    console.log('MFA Question page loaded, stored role:', storedRole);
    
    if (!challengeParams || challengeParams.challenge_type !== 'QA') {
      if (!hasNavigated) {
        console.log('Invalid challenge, redirecting to login');
        clearChallengeParams();
        localStorage.removeItem('pendingRole');
        navigate('/login', { replace: true });
      }
    }
  }, [challengeParams, navigate, hasNavigated, clearChallengeParams]);

  const question = challengeParams?.question || '';

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
      console.log("MFA Question result:", result);
      
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
        if (result.type === 'CAESAR') {
          navigate(`/mfa-caesar?role=${selectedRole}`, { replace: true });
        } else {
          localStorage.removeItem('pendingRole');
          if (selectedRole === 'FranchiseOperator') {
            navigate('/franchise-dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
      } else if (result && result.type === 'CAESAR') {
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        const storedRole = localStorage.getItem('pendingRole');
        const selectedRole = result.role || storedRole || urlRole || 'RegisteredCustomer';
        setHasNavigated(true);
        navigate(`/mfa-caesar?role=${selectedRole}`, { replace: true });
      } else {
        setError('Unexpected challenge step. Redirecting to login...');
        setHasNavigated(true);
        setTimeout(() => {
          clearChallengeParams();
          localStorage.removeItem('pendingRole');
          navigate('/login', { replace: true });
        }, 5000);
      }
    } catch (err) {
      console.error(err);
      setError('Incorrect answer. Redirecting to login...');
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
      <div className="mfa-question-container">
        <h2 className="mfa-question-title">Security Question</h2>
        <p className="mfa-question-text">{question}</p>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="mfa-question-form">
          <input
            className="mfa-question-input"
            placeholder="Your Answer"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            required
          />
          <button
            type="submit"
            className="mfa-question-button"
            disabled={loading}
          >
            {loading ? 'Verifying…' : 'Continue'}
          </button>
        </form>
      </div>
    </>
  );
}