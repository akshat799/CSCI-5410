import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

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
      // IMPORTANT: Store selected role when challenge is triggered
      console.log('Storing role for MFA:', selectedRole);
      localStorage.setItem('pendingRole', selectedRole);
      
      if (challengeParams.challenge_type === 'QA') {
        navigate(`/mfa-question?role=${selectedRole}`);
      } else {
        navigate(`/mfa-caesar?role=${selectedRole}`);
      }
    } else if (user) {
      // Simple redirect based on selected role
      console.log('Login success, redirecting based on selected role:', selectedRole);
      if (selectedRole === 'FranchiseOperator') {
        navigate('/franchise-dashboard');
      } else {
        navigate('/customer-home');
      }
    }
  }, [challengeParams, user, navigate, selectedRole]);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    // Store selected role BEFORE login attempt
    console.log('Storing selected role before login:', selectedRole);
    localStorage.setItem('pendingRole', selectedRole);
    
    try {
      const result = await login({ email, password, role: selectedRole });
      console.log('Login result:', result); // Debug log
      console.log('Selected role during login:', selectedRole); // Debug log
      
      if (result && result.success) {
        // IMPORTANT: Validate user's actual role against selected role
        const actualUserRole = await validateUserRole(email);
        console.log('Actual user role from Cognito:', actualUserRole);
        console.log('Selected role:', selectedRole);
        
        // Check if user selected the wrong role
        if (selectedRole === 'FranchiseOperator' && actualUserRole !== 'FranchiseOperator') {
          setError('Access denied. You are not authorized as a Franchise Operator. Please select "Customer" instead.');
          localStorage.removeItem('pendingRole');
          return;
        }
        
        if (selectedRole === 'RegisteredCustomer' && actualUserRole === 'FranchiseOperator') {
          setError('You are a Franchise Operator. Please select "Franchise Owner" to access your dashboard.');
          localStorage.removeItem('pendingRole');
          return;
        }
        
        // Role validation passed, redirect based on selected role
        console.log('Role validation passed, redirecting to:', selectedRole === 'FranchiseOperator' ? 'dashboard' : 'customer-home');
        if (selectedRole === 'FranchiseOperator') {
          navigate('/franchise-dashboard');
        } else {
          navigate('/customer-home');
        }
      }
      // If result.type exists, it means we have a challenge, useEffect will handle redirect
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

  // Helper function to validate user's actual role
  const validateUserRole = async (email) => {
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

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Login to DALScooter</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          
          {/* Role Selection */}
          <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#495057' }}>
              I am logging in as:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '6px',
                backgroundColor: selectedRole === 'RegisteredCustomer' ? '#e3f2fd' : 'transparent',
                border: selectedRole === 'RegisteredCustomer' ? '2px solid #2196f3' : '2px solid transparent'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="RegisteredCustomer"
                  checked={selectedRole === 'RegisteredCustomer'}
                  onChange={e => setSelectedRole(e.target.value)}
                  style={{ marginRight: '0.75rem', transform: 'scale(1.2)' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>Customer</div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                    Book bikes, view availability, track rides
                  </div>
                </div>
              </label>
              
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '6px',
                backgroundColor: selectedRole === 'FranchiseOperator' ? '#e8f5e8' : 'transparent',
                border: selectedRole === 'FranchiseOperator' ? '2px solid #4caf50' : '2px solid transparent'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="FranchiseOperator"
                  checked={selectedRole === 'FranchiseOperator'}
                  onChange={e => setSelectedRole(e.target.value)}
                  style={{ marginRight: '0.75rem', transform: 'scale(1.2)' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#2c3e50' }}>Franchise Owner</div>
                  <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                    Manage inventory, update pricing, view analytics
                  </div>
                </div>
              </label>
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: selectedRole === 'FranchiseOperator' ? '#4caf50' : '#2196f3',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? 'Logging in…' : `Login as ${selectedRole === 'FranchiseOperator' ? 'Franchise Owner' : 'Customer'}`}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          backgroundColor: '#fff3cd', 
          borderRadius: '8px', 
          fontSize: '0.9rem', 
          color: '#856404',
          border: '1px solid #ffeaa7'
        }}>
          <p style={{ margin: 0, fontWeight: '600' }}>💡 Choose the right role:</p>
          <ul style={{ marginLeft: '1rem', marginTop: '0.5rem', marginBottom: 0 }}>
            <li><strong>Customer:</strong> If you want to rent bikes and scooters</li>
            <li><strong>Franchise Owner:</strong> If you manage bike inventory and operations</li>
          </ul>
        </div>
      </div>
    </>
  );
}