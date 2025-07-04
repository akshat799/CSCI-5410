import './LoginPage.css';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = e => {
    e.preventDefault();
    const form = e.target;
    const email = form.elements[0].value.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email (e.g., name@example.com).');
      return;
    }

    navigate('/mfa-question');
  };

  return (
    <>
      <Navbar />
      <div className="login-bg">
        <div className="login-card">
          <h2 className="login-title">Welcome Back</h2>
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrapper">
                <input id="login-email" type="email" placeholder="Enter your email" required />
              </div>
            </div>
            <div className="input-group">
              <label htmlFor="login-password">Password</label>
              <div className="input-wrapper">
                <input id="login-password" type="password" placeholder="Enter your password" required />
              </div>
            </div>
            <button type="submit" className="submit-btn">Log In</button>
          </form>
          <div className="login-footer">
            <span>Don't have an account? </span>
            <a href="/register" className="signup-link">Register</a>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
