import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ParkingCircle, UserRound, Mail, Lock, ArrowRight } from "lucide-react";
import { apiRequest } from "./api";
import "./Auth.css";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
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

    if (form.password.length < 6) {
      setError("Password kam se kam 6 characters ka hona chahiye.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiRequest("/auth/signup", {
        method: "POST",
        body: JSON.stringify(form),
      });

      setSuccess(data.message || "Account created successfully!");

      setTimeout(() => navigate("/login"), 900);
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
          <span className="auth-eyebrow">GET STARTED</span>
          <h1>Create your account</h1>
          <p>Join ParkSmart and simplify your parking experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="name">Full name</label>
          <div className="auth-input">
            <UserRound size={19} />
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

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
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <div className="auth-message auth-error">{error}</div>}
          {success && <div className="auth-message auth-success">{success}</div>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-switch">
          Already registered? <Link to="/login">Login</Link>
        </p>

        <Link to="/" className="auth-home">← Back to home</Link>
      </section>
    </main>
  );
}