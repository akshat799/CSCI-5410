import React, { useState } from 'react';
import { signIn, confirmSignIn } from 'aws-amplify/auth';

export default function LoginFlow() {
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [challengeAnswer, setChallengeAnswer] = useState('');
  const [question, setQuestion] = useState('');
  const [authenticated, setAuthenticated] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const u = await signIn(username, password);
      setUser(u);

      if (u.challengeName === 'CUSTOM_CHALLENGE') {
        setQuestion(u.challengeParam.question);
        setStep(2);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed: ' + err.message);
    }
  };

  const handleAnswer = async (e) => {
    e.preventDefault();
    try {
      const next = await confirmSignIn(user, challengeAnswer);
      if (next.challengeName === 'CUSTOM_CHALLENGE') {
        setUser(next);
        setQuestion(next.challengeParam.question);
        setChallengeAnswer('');
        setStep(3);
      } else if (next.signInUserSession) {
        setAuthenticated(true);
      }
    } catch (err) {
      console.error('Challenge error:', err);
      alert('Challenge failed: ' + err.message);
    }
  };

  if (authenticated) return <h2>Logged in successfully!</h2>;

  return (
    <form
      onSubmit={step === 1 ? handleLogin : handleAnswer}
      style={{ padding: '0.5rem 0', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}
    >
      {step === 1 && (
        <>
          <h2>Login</h2>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </>
      )}
      {step > 1 && (
        <>
          <h2>Challenge</h2>
          <p><strong>{question}</strong></p>
          <input
            placeholder="Your Answer"
            value={challengeAnswer}
            onChange={(e) => setChallengeAnswer(e.target.value)}
            required
          />
        </>
      )}
      <button type="submit">{step === 1 ? 'Login' : 'Submit Answer'}</button>
    </form>
  );
}
