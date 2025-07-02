import React, { useState } from 'react';
import { Amplify } from 'aws-amplify';
import awsExports from './aws-exports';
import {
  ThemeProvider,
} from '@aws-amplify/ui-react';
import { dalscooterTheme } from './dalscooter-theme';
import '@aws-amplify/ui-react/styles.css';
import './App.css';
import SignupForm from './SignupForm';
import LoginFlow from './LoginFlow';

Amplify.configure(awsExports);

function App() {
  const [mode, setMode] = useState('signup'); // or 'login'

  return (
    <ThemeProvider theme={dalscooterTheme}>
      <div className="auth-page">
        <div className="auth-box">
          <div className="auth-brand">
            <h1>DALScooter</h1>
            <p>Smart Scooter Booking & Management</p>
          </div>

          <div className="toggle-buttons" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <button onClick={() => setMode('signup')}>Sign Up</button>
            <button onClick={() => setMode('login')}>Login</button>
          </div>

          <div className="auth-panel">
            {mode === 'signup' ? <SignupForm /> : <LoginFlow />}
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
