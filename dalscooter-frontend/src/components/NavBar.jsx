import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, signOut } = useAuth();
  const isLoggedIn       = Boolean(user);
  const navigate         = useNavigate();

  const handleLogout = e => {
    e.preventDefault();
    signOut();
    navigate('/');
  };

  return (
    <nav className="nav-container">
      <div className="nav-brand">
        <Link to="/">DALScooter</Link>
      </div>
      <div className="nav-links">
        { !isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/customer-home">Profile</Link>
            {/* use a real link or button so we can call logout */}
            <a href="/" onClick={handleLogout}>Logout</a>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;