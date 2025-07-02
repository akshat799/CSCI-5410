import React, { useState } from 'react';
import { signUp } from 'aws-amplify/auth';

export default function SignupForm() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
    question: 'What is your favorite color?',
    answer: '',
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const { username, password, email, question, answer } = form;
      await signUp({
        username,
        password,
        options: {
            userAttributes: { email },
            clientMetadata: {
            question,
            answer,
            },
        },
        });

      alert('Signup successful!');
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSignup} style={{ padding: '2rem', maxWidth: '400px' }}>
      <h2>Sign Up</h2>
      <input name="username" placeholder="Username" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
      <select name="question" onChange={handleChange}>
        <option>What is your favorite color?</option>
        <option>What city were you born in?</option>
        <option>What was your first school?</option>
      </select>
      <input name="answer" placeholder="Answer" onChange={handleChange} required />
      <button type="submit">Sign Up</button>
    </form>
  );
}
