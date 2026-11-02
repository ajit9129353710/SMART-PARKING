const express = require("express");
const ParkingLot = require("../models/ParkingLot");

const router = express.Router();

router.get("/", async (req, res) => {
try {
const parkingLots = await ParkingLot.find({
isActive: true,
});

res.status(200).json({
  success: true,
  count: parkingLots.length,
  parkingLots,
});

} catch (error) {
console.error("Parking Error:", error);

res.status(500).json({
  success: false,
  message: "Failed to fetch parking locations",
});

}
});

router.post("/search", async (req, res) => {
let currentStep = "Starting parking search";

try {
const { city } = req.body;

if (!city || !city.trim()) {
  return res.status(400).json({
    success: false,
    message: "Please enter a city name",
  });
}

currentStep = "Calling Nominatim API";

console.log("STEP 1:", currentStep);

const geoUrl = new URL(
  "https://nominatim.openstreetmap.org/search"
);

geoUrl.searchParams.set("q", city.trim());
geoUrl.searchParams.set("format", "jsonv2");
geoUrl.searchParams.set("limit", "1");
geoUrl.searchParams.set("addressdetails", "1");

const geoResponse = await fetch(geoUrl.toString(), {
  headers: {
    "User-Agent": "ParkSmartApp/1.0",
    "Accept": "application/json",
  },
  signal: AbortSignal.timeout(20000),
});

if (!geoResponse.ok) {
  throw new Error(
    `Nominatim HTTP Error: ${geoResponse.status}`
  );
}

const geoData = await geoResponse.json();

if (!geoData.length) {
  return res.status(404).json({
    success: false,
    message: "City not found",
  });
}

const location = geoData[0];

const [south, north, west, east] =
  location.boundingbox.map(Number);

currentStep = "Calling Overpass API";

console.log("STEP 2:", currentStep);

const query = `
  [out:json][timeout:25];
  (
    node["amenity"="parking"](${south},${west},${north},${east});
    way["amenity"="parking"](${south},${west},${north},${east});
    relation["amenity"="parking"](${south},${west},${north},${east});
  );
  out center tags;
`;

const overpassResponse = await fetch(
  "https://overpass-api.de/api/interpreter",
  {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent": "ParkSmartApp/1.0",
    },
    body: new URLSearchParams({
      data: query,
    }),
    signal: AbortSignal.timeout(45000),
  }
);

if (!overpassResponse.ok) {
  throw new Error(
    `Overpass HTTP Error: ${overpassResponse.status}`
  );
}

const overpassData = await overpassResponse.json();

console.log(
  "Parking locations found:",
  overpassData.elements?.length || 0
);

res.status(200).json({
  success: true,
  city: location.display_name,
  position: [
    Number(location.lat),
    Number(location.lon),
  ],
  elements: overpassData.elements || [],
});

} catch (error) {
console.error("FAILED STEP:", currentStep);
console.error("ERROR MESSAGE:", error.message);
console.error("ERROR DETAILS:", error.cause || error);

res.status(500).json({
  success: false,
  step: currentStep,
  message: error.message || "Failed to search parking",
});

}
});

module.exports = router;