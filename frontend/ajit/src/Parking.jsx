import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";
import L from "leaflet";
import {
  Search,
  MapPin,
  ParkingCircle,
  LoaderCircle,
  ExternalLink
} from "lucide-react";
import "./Parking.css";

const API_URL = "https://smart-parking-pyst.onrender.com";

const parkingIcon = L.divIcon({
  className: "parking-marker-wrapper",
  html: '<div class="parking-marker">P</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function ChangeMapView({ position, zoom }) {
  const map = useMap();
  map.setView(position, zoom);
  return null;
}

function getAddress(tags = {}) {
  const parts = [
    tags["addr:housenumber"],
    tags["addr:street"],
    tags["addr:suburb"],
    tags["addr:city"]
  ].filter(Boolean);

  return parts.length
    ? parts.join(", ")
    : "Address map data mein available nahi hai";
}

function getParkingName(tags = {}) {
  return (
    tags.name ||
    tags["name:en"] ||
    tags.operator ||
    "Parking Location"
  );
}

export default function Parking() {
  const [city, setCity] = useState("");
  const [searchedCity, setSearchedCity] = useState("");
  const [position, setPosition] = useState([28.6139, 77.209]);
  const [zoom, setZoom] = useState(12);
  const [parkingLocations, setParkingLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);

  async function searchParking(event) {
    event.preventDefault();

    const cityName = city.trim();

    if (!cityName) {
      setError("Please city ka naam enter karo.");
      return;
    }

    setLoading(true);
    setError("");
    setParkingLocations([]);
    setSearched(false);

    try {
      const response = await fetch(
        `${API_URL}/api/parking/search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            city: cityName
          })
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Parking search failed. Please try again."
        );
      }

      setPosition(data.position);
      setZoom(12);
      setSearchedCity(data.city);
      setSearched(true);

      const locations = (data.elements || [])
        .map((item) => {
          const lat = item.lat ?? item.center?.lat;
          const lon = item.lon ?? item.center?.lon;

          if (lat == null || lon == null) {
            return null;
          }

          return {
            id: `${item.type}-${item.id}`,
            name: getParkingName(item.tags),
            address: getAddress(item.tags),
            lat: Number(lat),
            lon: Number(lon),
            capacity: item.tags?.capacity || null,
            fee: item.tags?.fee || null,
            access: item.tags?.access || null,
            osmUrl: `https://www.openstreetmap.org/${item.type}/${item.id}`
          };
        })
        .filter(Boolean);

      setParkingLocations(locations);

      if (!locations.length) {
        setError(
          "Is city ke map data mein parking locations nahi mili. Kisi nearby ya bade city ka naam try karo."
        );
      }

    } catch (err) {
      console.error("Parking Search Error:", err);

      setError(
        err.message ||
          "Parking locations load nahi ho paayin. Internet connection check karo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="parking-page">
      <header className="parking-header">
        <a href="/" className="parking-brand">
          <ParkingCircle size={32} />
          <span>ParkSmart</span>
        </a>

        <span className="map-data-label">
          OpenStreetMap
        </span>
      </header>

      <section className="parking-search-section">
        <div className="parking-heading">
          <span className="parking-eyebrow">
            SMART PARKING FINDER
          </span>

          <h1>Find Parking in Any City</h1>

          <p>
            City ka naam enter karo aur map data mein listed
            parking locations search karo.
          </p>
        </div>

        <form
          className="city-search-form"
          onSubmit={searchParking}
        >
          <MapPin size={22} />

          <input
            type="text"
            placeholder="Enter city e.g. Lucknow, Delhi, Aligarh"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? (
              <LoaderCircle className="spin-icon" size={19} />
            ) : (
              <Search size={19} />
            )}

            {loading ? "Searching..." : "Find Parking"}
          </button>
        </form>

        {error && (
          <div className="parking-message">
            {error}
          </div>
        )}

        {searched && (
          <p className="searched-city">
            <MapPin size={16} />
            Search area: {searchedCity}
          </p>
        )}
      </section>

      <section className="parking-map-section">
        <div className="parking-map-heading">
          <div>
            <h2>Parking Map</h2>
            <p>
              {parkingLocations.length} map locations found
            </p>
          </div>

          <span className="map-status">
            Live map data
          </span>
        </div>

        <div className="parking-map">
          <MapContainer
            center={position}
            zoom={zoom}
            scrollWheelZoom={true}
          >
            <ChangeMapView
              position={position}
              zoom={zoom}
            />

            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {parkingLocations.map((location) => (
              <Marker
                key={location.id}
                position={[location.lat, location.lon]}
                icon={parkingIcon}
              >
                <Popup>
                  <div className="parking-popup">
                    <strong>{location.name}</strong>

                    <p>{location.address}</p>

                    {location.capacity && (
                      <p>
                        Capacity: {location.capacity}
                      </p>
                    )}

                    {location.fee && (
                      <p>Parking fee: {location.fee}</p>
                    )}

                    <a
                      href={location.osmUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View map details
                    </a>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="map-disclaimer">
          <MapPin size={19} />

          <p>
            Map par dikhne wali locations OpenStreetMap ke
            recorded data se aati hain. Har parking ki
            availability, price aur opening hours verified
            nahi hain. Abhi map par dikhne wali parking ko
            confirmed booking mat samajhna.
          </p>
        </div>
      </section>

      <section className="parking-results-section">
        <div className="parking-results-heading">
          <div>
            <h2>Parking Locations</h2>
            <p>Search results from map data</p>
          </div>

          <span className="results-count">
            {parkingLocations.length} found
          </span>
        </div>

        {parkingLocations.length > 0 ? (
          <div className="parking-results-grid">
            {parkingLocations.map((location) => (
              <article
                className="parking-result-card"
                key={location.id}
              >
                <div className="result-card-icon">
                  <ParkingCircle size={25} />
                </div>

                <h3>{location.name}</h3>

                <p className="result-address">
                  <MapPin size={16} />
                  {location.address}
                </p>

                <div className="result-extra">
                  {location.capacity && (
                    <span>
                      Capacity: {location.capacity}
                    </span>
                  )}

                  {location.fee && (
                    <span>
                      Fee: {location.fee}
                    </span>
                  )}

                  {!location.capacity && !location.fee && (
                    <span>
                      Availability not verified
                    </span>
                  )}
                </div>

                <a
                  className="result-map-link"
                  href={location.osmUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View Details
                  <ExternalLink size={16} />
                </a>
              </article>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="parking-empty-state">
              <ParkingCircle size={45} />

              <h3>
                {searched
                  ? "No parking locations found"
                  : "Search Your City"}
              </h3>

              <p>
                {searched
                  ? "Kisi doosre city ka naam try karo ya map data mein available locations check karo."
                  : "Upar city ka naam enter karo, jaise Lucknow, Delhi ya Aligarh."}
              </p>
            </div>
          )
        )}
      </section>

      <footer className="parking-footer">
        <p>
          ParkSmart · Map data © OpenStreetMap contributors
        </p>
      </footer>
    </main>
  );
}