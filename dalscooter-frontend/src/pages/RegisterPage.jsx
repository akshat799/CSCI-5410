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
    answer: ''
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
        attributes: {
          name: form.name.trim(),
          email: form.email.toLowerCase().trim(),
          'custom:secQuestion': form.question,
          'custom:secAnswer': form.answer.trim().toLowerCase()
        }
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
            Full Name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>
          <label>
            Email
            <input name="email" type="email" value={form.email} onChange={handleChange} required />
          </label>
          <label>
            Password
            <input name="password" type="password" value={form.password} onChange={handleChange} required />
          </label>
          <label>
            Security Question
            <select name="question" value={form.question} onChange={handleChange} required>
              <option value="">Select a question</option>
              <option value="What is your pet’s name?">What is your pet’s name?</option>
              <option value="What is your mother’s maiden name?">What is your mother’s maiden name?</option>
              <option value="What is your favorite color?">What is your favorite color?</option>
            </select>
          </label>
          <label>
            Your Answer
            <input name="answer" value={form.answer} onChange={handleChange} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Registering…' : 'Register'}
          </button>
        </form>
      </div>
    </>
  );
}
