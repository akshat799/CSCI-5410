import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/NavBar';
import { useAuth } from '../context/AuthContext';
import '../styles/LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, challengeParams, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('RegisteredCustomer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (challengeParams) {
      console.log('Storing role for MFA:', selectedRole);
      localStorage.setItem('pendingRole', selectedRole);
      const redirectPath = challengeParams.challenge_type === 'QA'
        ? `/mfa-question?role=${selectedRole}`
        : `/mfa-caesar?role=${selectedRole}`;
      navigate(redirectPath, { replace: true });
    } else if (user) {
      console.log('Login success, redirecting based on user role:', user.role);
      localStorage.removeItem('pendingRole');
      if (user.role === 'FranchiseOperator') {
        navigate('/franchise-dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [challengeParams, user, navigate, selectedRole]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    console.log('Storing selected role before login:', selectedRole);
    localStorage.setItem('pendingRole', selectedRole);
    
    try {
      const result = await login({ email, password, role: selectedRole });
      console.log('Login result:', result);
      console.log('Selected role during login:', selectedRole);
      
      if (result && result.success) {
        const actualUserRole = await validateUserRole(email);
        console.log('Actual user role from Cognito:', actualUserRole);
        
        if (selectedRole === 'FranchiseOperator' && actualUserRole !== 'FranchiseOperator') {
          setError('Access denied. You are not authorized as a Franchise Operator. Please select "Customer" instead.');
          localStorage.removeItem('pendingRole');
          setLoading(false);
          return;
        }
        
        if (selectedRole === 'RegisteredCustomer' && actualUserRole === 'FranchiseOperator') {
          setError('You are a Franchise Operator. Please select "Franchise Owner" to access your dashboard.');
          localStorage.removeItem('pendingRole');
          setLoading(false);
          return;
        }
        
        console.log('Role validation passed, redirecting to:', selectedRole === 'FranchiseOperator' ? 'dashboard' : 'home');
        localStorage.removeItem('pendingRole');
        if (selectedRole === 'FranchiseOperator') {
          navigate('/franchise-dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      if (err.code === 'UserNotConfirmedException') {
        navigate('/otp', { state: { email } });
      } else {
        setError(err.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateUserRole = async (email) => {
    try {
      const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
      console.log(`Validating user role for email: ${email}, user data:`, userData);
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

  return (
    <>
      <Navbar />
      <div className="login-container">
        <h2 className="login-title">Login to DALScooter</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="login-input"
          />
          
          <div className="role-selection">
            <label className="role-label">I am logging in as:</label>
            <div className="role-options">
              <label className={`role-option ${selectedRole === 'RegisteredCustomer' ? 'customer-selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="RegisteredCustomer"
                  checked={selectedRole === 'RegisteredCustomer'}
                  onChange={e => setSelectedRole(e.target.value)}
                />
                <div>
                  <div className="role-title">Customer</div>
                  <div className="role-description">
                    Book bikes, view availability, track rides
                  </div>
                </div>
              </label>
              
              <label className={`role-option ${selectedRole === 'FranchiseOperator' ? 'franchise-selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value="FranchiseOperator"
                  checked={selectedRole === 'FranchiseOperator'}
                  onChange={e => setSelectedRole(e.target.value)}
                />
                <div>
                  <div className="role-title">Franchise Owner</div>
                  <div className="role-description">
                    Manage inventory, update pricing, view analytics
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`login-button ${selectedRole === 'FranchiseOperator' ? 'franchise' : ''}`}
          >
            {loading ? 'Logging in…' : `Login as ${selectedRole === 'FranchiseOperator' ? 'Franchise Owner' : 'Customer'}`}
          </button>
        </form>
        
        <div className="info-box">
          <p className="info-title">💡 Choose the right role:</p>
          <ul className="info-list">
            <li><strong>Customer:</strong> If you want to rent bikes and scooters</li>
            <li><strong>Franchise Owner:</strong> If you manage bike inventory and operations</li>
          </ul>
        </div>
      </div>
    </>
  );
}