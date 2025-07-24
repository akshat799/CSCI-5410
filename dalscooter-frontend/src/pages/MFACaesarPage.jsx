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

  // Helper function to validate user's actual role
  const validateUserRole = async () => {
    try {
      // Get the user's token to check their actual groups
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.idToken) {
        // Decode the token to check groups
        const parts = user.idToken.split('.');
        if (parts.length === 3) {
          let payload = parts[1];
          // Add padding if necessary
          while (payload.length % 4) {
            payload += '=';
          }
          
          const decodedPayload = JSON.parse(atob(payload));
          const groups = decodedPayload['cognito:groups'];
          const customRole = decodedPayload['custom:role'];
          
          console.log('User groups from token:', groups);
          console.log('User custom role from token:', customRole);
          
          // Check if user is in FranchiseOperator group
          if (Array.isArray(groups) && groups.includes('FranchiseOperator')) {
            return 'FranchiseOperator';
          } else if (customRole === 'FranchiseOperator') {
            return 'FranchiseOperator';
          }
        }
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
        // Get selected role and validate against actual role
        const urlParams = new URLSearchParams(window.location.search);
        const urlRole = urlParams.get('role');
        const storedRole = localStorage.getItem('pendingRole');
        const selectedRole = urlRole || storedRole || 'RegisteredCustomer';
        
        // Validate user's actual role
        const actualUserRole = await validateUserRole();
        
        console.log('Selected role:', selectedRole);
        console.log('Actual user role:', actualUserRole);
        
        // Role validation
        if (selectedRole === 'FranchiseOperator' && actualUserRole !== 'FranchiseOperator') {
          setError('Access denied. You are not authorized as a Franchise Operator.');
          localStorage.removeItem('pendingRole');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        if (selectedRole === 'RegisteredCustomer' && actualUserRole === 'FranchiseOperator') {
          setError('You are a Franchise Operator. Please login again and select "Franchise Owner".');
          localStorage.removeItem('pendingRole');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }
        
        // Role validation passed, redirect
        if (selectedRole === 'FranchiseOperator') {
          navigate('/franchise-dashboard');
        } else {
          navigate('/customer-home');
        }
        
        // Clean up
        localStorage.removeItem('pendingRole');
      } else {
        setError('Incorrect decryption. Redirecting to login...');
        setTimeout(() => {
          clearChallengeParams();
          localStorage.removeItem('pendingRole');
          navigate('/login');
        }, 5000);
      }
    } catch (err) {
      console.error(err);
      setError('Verification failed. Redirecting to login...');
      setTimeout(() =>{
        clearChallengeParams();
        localStorage.removeItem('pendingRole');
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