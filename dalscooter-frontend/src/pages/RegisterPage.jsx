import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/RegisterPage.css';

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
      <div className="register-container">
        <h2 className="register-title">Create an Account</h2>
        {error && <p className="error-message">{error}</p>}
        <form onSubmit={handleSubmit} className="register-form">
          <label className="register-label">
            Full Name
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="register-input"
            />
          </label>

          <label className="register-label">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="register-input"
            />
          </label>

          <label className="register-label">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
              className="register-input"
            />
          </label>

          <label className="register-label">
            Security Question
            <select
              name="question"
              value={form.question}
              onChange={handleChange}
              required
              className="register-select"
            >
              <option value="">Select a question</option>
              <option value="What is your pet’s name?">What is your pet’s name?</option>
              <option value="What is your mother’s maiden name?">What is your mother’s maiden name?</option>
              <option value="What is your favorite color?">What is your favorite color?</option>
            </select>
          </label>

          <label className="register-label">
            Your Answer
            <input
              name="answer"
              value={form.answer}
              onChange={handleChange}
              required
              className="register-input"
            />
          </label>

          <label className="register-label">
            I am signing up as
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              required
              className="register-select"
            >
              <option value="">Select a role</option>
              <option value="RegisteredCustomer">User</option>
              <option value="FranchiseOperator">Franchise Owner</option>
            </select>
          </label>

          <label className="register-label">
            Caesar Text
            <input
              name="caesarText"
              value={form.caesarText}
              onChange={handleChange}
              placeholder="Enter text to encrypt"
              className="register-input"
            />
          </label>

          <label className="register-label">
            Shift Key
            <input
              name="shiftKey"
              type="number"
              value={form.shiftKey}
              onChange={handleChange}
              placeholder="e.g. 3"
              className="register-input"
            />
          </label>

          <button type="submit" disabled={loading} className="register-button">
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </>
  );
}