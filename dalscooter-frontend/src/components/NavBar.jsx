import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="nav-container">
      <div className="nav-brand">
        <Link to="/">DALScooter</Link>
      </div>
      <div className="nav-links">
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to="/customer-home">Profile</Link>
            <Link to="/">Logout</Link>
            {/* <button onClick={handleLogout} style={{cursor: 'pointer' }}>
              Logout
            </button> */}
          </>
        )}
      </div>
    </div>
  );
}

export default Navbar;
