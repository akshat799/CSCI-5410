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
      <div className="container">
        <h2>Login to Your Account</h2>
        <form onSubmit={handleLogin}>
          <input type="email" placeholder="Email" required />
          <input type="password" placeholder="Password" required />
          <button type="submit">Login</button>
        </form>
      </div>
    </>
  );
}

export default LoginPage;
