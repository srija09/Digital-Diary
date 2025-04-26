import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">Digital Diary</Link>
        <div className="navbar-links">
          {token ? (
            <>
              <Link to="/notes" className="navbar-link">Notes</Link>
              <button onClick={handleLogout} className="navbar-button">Logout</button>
            </>
          ) : (
            <>
              <Link to="/" className="navbar-link">Login</Link>
              <Link to="/register" className="navbar-link">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;