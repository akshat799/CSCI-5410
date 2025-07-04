import Navbar from '../components/Navbar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

function RegisterPage() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();

    const { name, email, password, question, answer } = form;

    if (!name || name.trim().length < 2) {
        alert('Please enter a valid full name.');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!email || !emailRegex.test(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    if (!password || password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
    }

    if (!question || question === '') {
        alert('Please select a security question.');
        return;
    }

    if (!answer || answer.trim().length < 2) {
        alert('Please provide a valid answer to the security question.');
        return;
    }
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="login-bg">
        <div className="login-card">
          <h2 className="login-title">Create Account</h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="register-name">Full Name</label>
              <div className="input-wrapper">
                <input id="register-name" name="name" placeholder="Enter your name" onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="register-email">Email Address</label>
              <div className="input-wrapper">
                <input id="register-email" name="email" type="email" placeholder="Enter your email" onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="register-password">Password</label>
              <div className="input-wrapper">
                <input id="register-password" name="password" type="password" placeholder="Enter your password" onChange={handleChange} required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="register-question">Security Question</label>
              <div className="input-wrapper">
                <select id="register-question" name="question" onChange={handleChange} required>
                  <option value="" disabled selected>Select a security question</option>
                  <option>What is your pet's name?</option>
                  <option>What is your mother's maiden name?</option>
                  <option>What is your favourite color?</option>
                </select>
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="register-answer">Your Answer</label>
              <div className="input-wrapper">
                <input id="register-answer" name="answer" placeholder="Your Answer" onChange={handleChange} required />
              </div>
            </div>
            <button type="submit" className="submit-btn">Register</button>
          </form>
          <div className="login-footer">
            <span>Already have an account? </span>
            <a href="/login" className="signup-link">Login</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default RegisterPage;
