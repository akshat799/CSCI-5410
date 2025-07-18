// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    question: '',
    answer: '',
    role: '',
    caesarText: '',
    shiftKey: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({
        username: form.email.toLowerCase().trim(),
        password: form.password,
        name: form.name.trim(),
        email: form.email.toLowerCase().trim(),
        question: form.question,
        answer: form.answer.trim().toLowerCase(),
        role: form.role,
        caesarText: form.caesarText,
        shiftKey: form.shiftKey
      });
      navigate('/login');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Create an Account</h2>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit}>
          <label>
            Full Name<br />
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={{ marginTop: '0.25rem' }}
            />
          </label>

          <label>
            Email<br />
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ marginTop: '0.25rem' }}
            />
          </label>

          <label>
            Password<br />
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ marginTop: '0.25rem' }}
            />
          </label>

          <label>
            Security Question<br />
            <select
              name="question"
              value={form.question}
              onChange={handleChange}
              required
              style={{ marginTop: '0.25rem' }}
            >
              <option value="">Select a question</option>
              <option value="What is your pet’s name?">What is your pet’s name?</option>
              <option value="What is your mother’s maiden name?">What is your mother’s maiden name?</option>
              <option value="What is your favorite color?">What is your favorite color?</option>
            </select>
          </label>

          <label>
            Your Answer<br />
            <input
              name="answer"
              value={form.answer}
              onChange={handleChange}
              required
              style={{ marginTop: '0.25rem' }}
            />
          </label>

          <label>
            I am signing up as<br />
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              style={{ marginTop: '0.25rem' }}
            >
              <option value="">Select a role</option>
              <option value="RegisteredCustomer">User</option>
              <option value="FranchiseOperator">Franchise Owner</option>
            </select>
          </label>
          <label>
            Caesar Text<br />
            <input
              name="caesarText"
              value={form.caesarText}
              onChange={handleChange}
              placeholder="Enter text to encrypt"
              style={{ marginTop: '0.25rem' }}
            />
          </label>
          <label>
            Shift Key<br />
            <input
              name="shiftKey"
              type="number"
              value={form.shiftKey}
              onChange={handleChange}
              placeholder="e.g. 3"
              style={{ marginTop: '0.25rem' }}
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </>
  );
}
