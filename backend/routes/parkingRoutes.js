const express = require("express");
const router = express.Router();

router.get("/", async (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Parking API is active.",
  });
});

router.post("/search", async (req, res) => {
  try {
    const { city } = req.body;

    if (!city || typeof city !== "string" || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid city name.",
      });
    }

    const cleanCity = city.trim();

    const geoUrl = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
      cleanCity
    )}`;

    const geoResponse = await fetch(geoUrl, {
      headers: {
        "User-Agent": "ParkSmartApp/1.0",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!geoResponse.ok) {
      throw new Error("Geocoding API failed");
    }

    const geoData = await geoResponse.json();

    if (!Array.isArray(geoData) || geoData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "City not found. Please enter another city.",
      });
    }

    const lat = Number(geoData[0].lat);
    const lon = Number(geoData[0].lon);

    const radius = 5000;
    const query = `
      [out:json][timeout:25];
      (
        node["amenity"="parking"](around:${radius},${lat},${lon});
        way["amenity"="parking"](around:${radius},${lat},${lon});
      );
      out center tags;
    `;

    let elements = [];

    try {
      const overpassResponse = await fetch(
        "https://overpass-api.de/api/interpreter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": "ParkSmartApp/1.0",
          },
          body: new URLSearchParams({
            data: query,
          }),
          signal: AbortSignal.timeout(20000),
        }
      );

      if (overpassResponse.ok) {
        const overpassData = await overpassResponse.json();
        elements = overpassData.elements || [];
      }
    } catch (overpassErr) {
      console.error("Overpass API error:", overpassErr.message);
    }

    return res.status(200).json({
      success: true,
      city: geoData[0].display_name,
      position: [lat, lon],
      elements,
      count: elements.length,
      message: "Parking locations fetched successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Parking search failed.",
    });
  }
});

module.exports = router;