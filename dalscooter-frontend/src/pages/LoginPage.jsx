import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = e => {
    e.preventDefault();
    // TODO: Login verification logic
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
