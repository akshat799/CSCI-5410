import Navbar from '../components/Navbar';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function RegisterPage() {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = e => {
    e.preventDefault();
    // TODO: Registration logic
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className="container">
        <h2>Create an Account</h2>
        <form onSubmit={handleSubmit}>
          <input name="name" placeholder="Full Name" onChange={handleChange} required />
          <input name="email" type="email" placeholder="Email" onChange={handleChange} required />
          <input name="password" type="password" placeholder="Password" onChange={handleChange} required />
          <select name="question" onChange={handleChange} required>
            <option value="">Select a security question</option>
            <option>What is your pet’s name?</option>
            <option>What is your mother’s maiden name?</option>
            <option>What is your favourite color?</option>
          </select>
          <input name="answer" placeholder="Your Answer" onChange={handleChange} required />
          <button type="submit">Register</button>
        </form>
      </div>
    </>
  );
}

export default RegisterPage;
