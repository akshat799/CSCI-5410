import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <div className="nav-container">
      <div className="nav-brand">
        <Link to="/">DALScooter</Link>
      </div>
      <div className="nav-links">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  );
}

export default Navbar;
