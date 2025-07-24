<<<<<<< HEAD
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";
=======
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
>>>>>>> upstream/main

function Navbar() {
  const { user, logout } = useAuth();
  const isLoggedIn = Boolean(user);
  const navigate = useNavigate();

  const handleLogout = e => {
    e.preventDefault();
    logout();
    navigate('/');
  };

  const getHomeLink = () => {
    if (!user) return '/';
    return user.role === 'FranchiseOperator' ? '/franchise-dashboard' : '/customer-home';
  };

  const getProfileText = () => {
    if (!user) return 'Profile';
    // Check current page to determine role context
    const currentPath = window.location.pathname;
    return currentPath.includes('franchise') ? 'Dashboard' : 'Profile';
  };

  const getRoleDisplay = () => {
    if (!user) return '';
    const currentPath = window.location.pathname;
    return currentPath.includes('franchise') ? 'Franchise' : 'Customer';
  };

  return (
<<<<<<< HEAD
    <nav className="nav-container">
      <div className="nav-brand">
        <Link to={getHomeLink()}>DALScooter</Link>
      </div>
      <div className="nav-links">
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        ) : (
          <>
            <Link to={getHomeLink()}>{getProfileText()}</Link>
            {user && (
              <span className="text-sm text-gray-600 mr-2">
                ({getRoleDisplay()})
              </span>
            )}
            <a href="/" onClick={handleLogout}>Logout</a>
=======
    <nav className="bg-gray-50 px-8 py-4 flex justify-between items-center border-b border-gray-300 shadow-sm">
      <div>
        <Link 
          to={getHomeLink()} 
          className="text-2xl font-bold text-black no-underline hover:text-orange-500 transition-colors duration-200"
          style={{ textDecoration: 'none' }}
        >
          DALScooter
        </Link>
      </div>
      <div className="flex items-center space-x-6">
        {!isLoggedIn ? (
          <>
            <Link 
              to="/login" 
              className="text-black text-base font-medium hover:text-orange-500 transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="text-black text-base font-medium hover:text-orange-500 transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              Register
            </Link>
            <Link 
              to="/feedback" 
              className="text-black text-base font-medium hover:text-orange-500 transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              Feedback
            </Link>
          </>
        ) : (
          <>
            <Link 
              to={getHomeLink()} 
              className="text-black text-base font-medium hover:text-orange-500 transition-colors duration-200"
              style={{ textDecoration: 'none' }}
            >
              {getProfileText()}
            </Link>
            {user && (
              <span className="text-sm text-gray-600">
                ({getRoleDisplay()})
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-black text-base font-medium hover:text-orange-500 transition-colors duration-200 bg-transparent border-0 cursor-pointer"
            >
              Logout
            </button>
>>>>>>> upstream/main
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;