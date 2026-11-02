const express = require("express");
const router = express.Router();

const ParkingLot = require("../models/ParkingLot");

router.get("/", async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({
      isActive: true,
    });

    return res.status(200).json({
      success: true,
      count: parkingLots.length,
      parkingLots,
    });
  } catch (error) {
    console.error("Parking Fetch Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch parking locations",
    });
  }
});

router.post("/search", async (req, res) => {
  let currentStep = "Starting";

  try {
    const { city } = req.body;

    if (!city || typeof city !== "string" || !city.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid city name.",
      });
    }

    currentStep = "Nominatim Geocoding";

    const geoUrl = new URL(
      "https://nominatim.openstreetmap.org/search"
    );

    geoUrl.searchParams.set("format", "jsonv2");
    geoUrl.searchParams.set("limit", "1");
    geoUrl.searchParams.set("q", city.trim());

    const geoResponse = await fetch(geoUrl, {
      method: "GET",
      headers: {
        "User-Agent": "ParkSmartApp/1.0",
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!geoResponse.ok) {
      throw new Error(
        `Geocoding API returned status ${geoResponse.status}`
      );
    }

    const geoData = await geoResponse.json();

    if (!Array.isArray(geoData) || geoData.length === 0) {
      return res.status(404).json({
        success: false,
        message: "City not found. Please enter another city.",
      });
    }

    const location = geoData[0];
    const lat = Number(location.lat);
    const lon = Number(location.lon);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new Error("Invalid city coordinates received.");
    }

    currentStep = "Overpass Parking Search";

    const radius = 5000;

    const query = `
      [out:json][timeout:25];

      (
        node["amenity"="parking"](around:${radius},${lat},${lon});
        way["amenity"="parking"](around:${radius},${lat},${lon});
      );

      out center tags;
    `;

    // ऑफिशियल और सबसे भरोसेमंद सर्वर को सबसे ऊपर रखा गया है
    const overpassServers = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.private.coffee/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let overpassData = null;
    const apiErrors = [];

    for (const server of overpassServers) {
      try {
        const overpassResponse = await fetch(server, {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded;charset=UTF-8",
            "Accept": "application/json",
            "User-Agent": "ParkSmartApp/1.0",
          },
          body: new URLSearchParams({
            data: query,
          }),
          signal: AbortSignal.timeout(35000),
        });

        if (!overpassResponse.ok) {
          throw new Error(
            `Overpass returned HTTP ${overpassResponse.status}`
          );
        }

        const result = await overpassResponse.json();

        if (!result || !Array.isArray(result.elements)) {
          throw new Error("Invalid parking data received.");
        }

        overpassData = result;
        break;
      } catch (error) {
        apiErrors.push({
          server,
          error: error.message,
        });
      }
    }

    if (!overpassData) {
      return res.status(503).json({
        success: false,
        failedStep: currentStep,
        message:
          "Parking data service is temporarily unavailable. Please try again later.",
      });
    }

    const elements = overpassData.elements || [];

    return res.status(200).json({
      success: true,
      city: location.display_name,
      position: [lat, lon],
      elements,
      count: elements.length,
      message: "Parking locations fetched successfully.",
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      failedStep: currentStep,
      message: error.message || "Parking search failed.",
    });
  }
});

module.exports = router;