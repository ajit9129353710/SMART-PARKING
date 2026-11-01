import { Link, useNavigate } from "react-router-dom";
import {
ParkingCircle,
MapPin,
Search,
ShieldCheck,
Clock,
ArrowRight,
CheckCircle2,
Menu
} from "lucide-react";
import { useState } from "react";
import "./App.css";

export default function Home() {
const [city, setCity] = useState("");
const navigate = useNavigate();

function handleSearch(event) {
event.preventDefault();

if (!city.trim()) {
  alert("Please enter a city name.");
  return;
}

navigate(`/parking?city=${encodeURIComponent(city.trim())}`);

}

return (
<div className="home-page">
<nav className="navbar">
<Link to="/" className="brand">
<ParkingCircle size={32} />
<span>ParkSmart</span>
</Link>

    <div className="nav-links">
      <a href="#features">Features</a>
      <a href="#how-it-works">How It Works</a>
      <Link to="/parking">Find Parking</Link>
    </div>

    <div className="nav-actions">
      <Link to="/login" className="login-btn">
        Login
      </Link>

      <Link to="/signup" className="signup-btn">
        Sign Up
      </Link>
    </div>
  </nav>

  <section className="hero-section">
    <div className="hero-content">
      <div className="hero-badge">
        <CheckCircle2 size={16} />
        Smart Parking Made Simple
      </div>

      <h1>
        Find Your Perfect
        <span> Parking Spot</span>
      </h1>

      <p>
        Discover parking locations in your city with ParkSmart.
        Search locations on the map and explore available parking
        information.
      </p>

      <form className="hero-search" onSubmit={handleSearch}>
        <MapPin size={23} />

        <input
          type="text"
          placeholder="Enter city, e.g. Lucknow or Delhi"
          value={city}
          onChange={(event) => setCity(event.target.value)}
        />

        <button type="submit">
          <Search size={18} />
          Find Parking
        </button>
      </form>

      <div className="hero-note">
        <ShieldCheck size={17} />
        Explore parking locations in one place
      </div>
    </div>

    <div className="hero-visual">
      <div className="parking-illustration">
        <div className="illustration-top">
          <ParkingCircle size={36} />
          <span>Smart Parking</span>
        </div>

        <div className="parking-symbol">P</div>

        <div className="illustration-bottom">
          <div>
            <MapPin size={18} />
            <span>Find locations</span>
          </div>

          <div>
            <Clock size={18} />
            <span>Save time</span>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section className="features-section" id="features">
    <div className="section-heading">
      <span>WHY PARKSMART?</span>
      <h2>Parking Made Easier</h2>
      <p>Useful tools to help you find parking locations.</p>
    </div>

    <div className="features-grid">
      <article className="feature-card">
        <div className="feature-icon">
          <Search size={25} />
        </div>
        <h3>Easy Search</h3>
        <p>Search parking locations by entering a city name.</p>
      </article>

      <article className="feature-card">
        <div className="feature-icon">
          <MapPin size={25} />
        </div>
        <h3>Map Locations</h3>
        <p>Explore parking points recorded in OpenStreetMap.</p>
      </article>

      <article className="feature-card">
        <div className="feature-icon">
          <ShieldCheck size={25} />
        </div>
        <h3>Simple Experience</h3>
        <p>Explore locations through a clean and simple interface.</p>
      </article>
    </div>
  </section>

  <section className="how-section" id="how-it-works">
    <div className="section-heading">
      <span>GET STARTED</span>
      <h2>How It Works</h2>
    </div>

    <div className="steps-grid">
      <div className="step-card">
        <span>01</span>
        <h3>Enter Your City</h3>
        <p>Type the city where you want to find parking.</p>
      </div>

      <div className="step-card">
        <span>02</span>
        <h3>Explore the Map</h3>
        <p>View parking locations available in the map data.</p>
      </div>

      <div className="step-card">
        <span>03</span>
        <h3>Check Details</h3>
        <p>Open a location to view the details recorded for it.</p>
      </div>
    </div>
  </section>

  <section className="cta-section">
    <div>
      <h2>Ready to Find Parking?</h2>
      <p>Start by searching for a city.</p>
    </div>

    <Link to="/parking" className="cta-button">
      Explore Parking <ArrowRight size={18} />
    </Link>
  </section>

  <footer className="home-footer">
    <Link to="/" className="brand">
      <ParkingCircle size={25} />
      <span>ParkSmart</span>
    </Link>

    <p>
      © {new Date().getFullYear()} ParkSmart. Map data © OpenStreetMap
      contributors.
    </p>

    <div className="footer-links">
      <Link to="/login">Login</Link>
      <Link to="/signup">Sign Up</Link>
    </div>
  </footer>
</div>

);
}