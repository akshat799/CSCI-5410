import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";
import "../styles/Navbar.css";
import { getAuthHeaders } from "../services/apiService";
const API_URL = import.meta.env.VITE_API_BASE_URL;

function Navbar() {
  const { user, logout } = useAuth();
  const isLoggedIn = Boolean(user);
  const navigate = useNavigate();

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      // Call the logout API endpoint
      await axios.post(`${API_URL}/logout`, {}, { headers: getAuthHeaders() });
      logout();
      navigate("/");
    } catch (error) {
      console.error("Error recording logout:", error);
      logout(); // Proceed with logout even if API call fails
      navigate("/");
    }
  };

    const getHomeLink = () => {
      if (!user) return "/";
      return user.role === "FranchiseOperator" ? "/franchise-dashboard" : "/";
    };

    const getRoleDisplay = () => {
      if (!user) return "";
      const currentPath = window.location.pathname;
      return currentPath.includes("franchise") ? "Franchise" : "Customer";
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
              {user && <span className="nav-role">({getRoleDisplay()})</span>}
              <button onClick={handleLogout}>Logout</button>
            </>
          )}
        </div>
      </nav>
    );
  };

export default Navbar;
