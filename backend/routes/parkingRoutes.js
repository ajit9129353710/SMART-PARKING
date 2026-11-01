const express = require("express");
const ParkingLot = require("../models/ParkingLot");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const parkingLots = await ParkingLot.find({ isActive: true });

    res.status(200).json({
      success: true,
      count: parkingLots.length,
      parkingLots,
    });
  } catch (error) {
    console.error("Parking Error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch parking locations",
    });
  }
});

module.exports = router;