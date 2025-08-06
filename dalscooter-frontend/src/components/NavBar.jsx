import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Navbar.css";

function Navbar() {
  const { user, logout } = useAuth();
  const isLoggedIn = Boolean(user);
  const navigate = useNavigate();

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate("/");
  };

  const getHomeLink = () => {
    if (!user) return "/";
    return user.role === "FranchiseOperator" ? "/franchise-dashboard" : "/";
  };

  return (
    <nav className="nav-container">
      <div className="nav-brand">
        <Link to={getHomeLink()}>DALScooter</Link>
      </div>
      <div className="nav-links">
        {!isLoggedIn ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
            <Link to="/feedback">Feedback</Link>
          </>
        ) : (
          <>
            <Link to="/profile">Profile</Link>
            <button onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
