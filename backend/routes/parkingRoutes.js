const express = require("express");
const router = express.Router();

const ParkingLot = require("../models/ParkingLot");

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
    console.error("Parking Fetch Error:", error.message);

    res.status(500).json({
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
      signal: AbortSignal.timeout(8000),
    });

    if (!geoResponse.ok) {
      throw new Error(
        `Geocoding API returned status ${geoResponse.status}`
      );
    }

    const geoData = await geoResponse.json();

    if (!geoData || geoData.length === 0) {
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

    const query = `
      [out:json][timeout:12];

      (
        node["amenity"="parking"](around:5000,${lat},${lon});
        way["amenity"="parking"](around:5000,${lat},${lon});
        relation["amenity"="parking"](around:5000,${lat},${lon});
      );

      out center tags;
    `;
    const overpassServers = [
      "https://overpass.private.coffee/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
    ];

    let overpassData = null;
    let apiErrors = [];

    for (const server of overpassServers) {
      try {
        console.log("Trying Overpass API:", server);

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

          signal: AbortSignal.timeout(10000),
        });

        if (!overpassResponse.ok) {
          throw new Error(
            `API returned status ${overpassResponse.status}`
          );
        }

        const result = await overpassResponse.json();

        if (!result || !Array.isArray(result.elements)) {
          throw new Error("Invalid parking data received.");
        }

        overpassData = result;

        console.log("Overpass API successful:", server);

        break;

      } catch (error) {
        console.error(
          "Overpass API Failed:",
          server,
          error.message
        );

        apiErrors.push({
          server,
          error: error.message,
        });
      }
    }

    if (!overpassData) {
      console.error("All Overpass APIs failed:", apiErrors);

      return res.status(503).json({
        success: false,
        message:
          "Parking search service is temporarily unavailable. Please try again after some time.",
      });
    }

    res.status(200).json({
      success: true,

      city: location.display_name,

      position: [lat, lon],

      elements: overpassData.elements || [],

      count: overpassData.elements.length,

      message: "Parking locations fetched successfully.",
    });

  } catch (error) {
    console.error("PARKING SEARCH FAILED");
    console.error("FAILED STEP:", currentStep);
    console.error("ERROR MESSAGE:", error.message);
    console.error("ERROR DETAILS:", error.cause || error);

    res.status(500).json({
      success: false,
      message: error.message || "Parking search failed.",
      failedStep: currentStep,
    });
  }
});

module.exports = router;