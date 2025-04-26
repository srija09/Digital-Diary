import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://digital-diary-zddh.onrender.com/api/users/register', {
        username,
        password
      },{
        headers: {
          'Content-Type': 'application/json'
        }
      });
      navigate('/');
    } catch (err) {
      setError('Registration failed. Username may already exist.');
    }
  };

  return (
    <div className="form-container">
      <h2 className="form-title">Register</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-input"
          />
        </div>
        <button type="submit" className="form-button">Register</button>
      </form>
    </div>
  );
}

export default Register;