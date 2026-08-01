import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/login.css"; // Ensure this path is correct

// Internal SVG Icons to keep the file standalone and designable.
const WarehouseIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#1565C0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 .85-1.63l8-5.83a2 2 0 0 1 2.3 0l8 5.83a2 2 0 0 1 .85 1.63z" />
    <path d="M6 18h12" />
    <path d="M6 14h12" />
    <rect x="10" y="10" width="4" height="10" />
  </svg>
);

const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#757575" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Consolidated login function
  const handleLoginSubmit = async (e) => {
    // Prevent the form from submitting via standard HTML behavior
    e.preventDefault();

    try {
      setLoading(true);

      const res = await api.post("/auth/login", {
        username: username,
        password: password
      });

      // Retain your localStorage logic
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Navigate to dashboard
      navigate("/dashboard");

    } catch (err) {
      console.error(err);

      // Handle alerts/errors
      if (err.response) {
        alert(JSON.stringify(err.response.data));
      } else {
        alert(err.message);
      }

    } finally {
      // Ensure loading state is reset
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header Section */}
        <div className="login-header">
          <div className="logo-badge">
            <WarehouseIcon />
          </div>
          <h1 className="login-title">BAJWA PICKING SYSTEM</h1>
          <p className="login-owner">Owner: Jagpreet Singh</p>
        </div>

        <hr className="login-divider" />

        {/* Login Form (Handles submission via onSubmit) */}
        <form onSubmit={handleLoginSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <UserIcon />
              </span>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">
                <LockIcon />
              </span>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className={`login-button ${loading ? "loading" : ""}`}
            disabled={loading}
          >
            {loading ? "LOGGING IN..." : "LOGIN"}
          </button>
        </form>

        <hr className="login-divider" />

        {/* Footer */}
        <div className="login-footer">
          <span>Secure</span> • <span>Reliable</span> • <span>Efficient</span>
        </div>
      </div>
    </div>
  );
}

export default Login;