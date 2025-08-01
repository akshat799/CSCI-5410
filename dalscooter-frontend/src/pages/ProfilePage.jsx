import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/NavBar.jsx';
import '../styles/ProfilePage.css';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="profile-container">
        <Navbar />
        <div className="profile-card">
          <h2 className="profile-title">Profile</h2>
          <p>You are not logged in.</p>
          <a className="profile-button" href="/login">Sign in</a>
        </div>
      </div>
    );
  }

  // Extract groups/roles conveniently
  const groups = user.groups?.groups?.length 
    ? user.groups.groups : [];
  const customRole = user.groups?.customRole;

  return (
    <>
    <Navbar />
    <div className="profile-container">
      <div className="profile-card">
        <h2 className="profile-title">Account Profile</h2>

        <div className="profile-detail-row">
          <span className="profile-label">Email:</span>
          <span className="profile-value">{user.email}</span>
        </div>

        {customRole && (
          <div className="profile-detail-row">
            <span className="profile-label">Role:</span>
            <span className="profile-value">{customRole}</span>
          </div>
        )}

        {groups && groups.length > 0 && (
          <div className="profile-detail-row">
            <span className="profile-label">Groups:</span>
            <span className="profile-value">
              {groups.join(', ')}
            </span>
          </div>
        )}

        <button className="profile-button" onClick={() => navigate('/')}>
            Dashboard
        </button>
        <button className="profile-button logout" onClick={logout}>
          Log Out
        </button>
        
      </div>
    </div>
    </>
  );
}
