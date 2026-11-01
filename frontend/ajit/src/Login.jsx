import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ParkingCircle, Mail, Lock, ArrowRight } from "lucide-react";
import { apiRequest } from "./api";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });

      if (!data.token) {
        throw new Error("Login token response mein nahi mila.");
      }

      localStorage.setItem("parksmart_token", data.token);

      if (data.user) {
        localStorage.setItem("parksmart_user", JSON.stringify(data.user));
      }

      setSuccess("Login successful! Redirecting...");

      setTimeout(() => navigate("/parking"), 700);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon"><ParkingCircle size={27} /></span>
          Park<span>Smart</span>
        </Link>

        <div className="auth-heading">
          <span className="auth-eyebrow">WELCOME BACK</span>
          <h1>Login to your account</h1>
          <p>Manage your parking bookings in one place.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="email">Email address</label>
          <div className="auth-input">
            <Mail size={19} />
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="password">Password</label>
          <div className="auth-input">
            <Lock size={19} />
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
              required
            />
          </div>

          {error && <div className="auth-message auth-error">{error}</div>}
          {success && <div className="auth-message auth-success">{success}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login to ParkSmart"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create account</Link>
        </p>

        <Link to="/" className="auth-home">← Back to home</Link>
      </section>
    </main>
  );
}