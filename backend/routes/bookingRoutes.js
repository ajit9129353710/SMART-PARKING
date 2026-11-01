const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const ParkingLot = require("../models/ParkingLot");
const authMiddleware = require("../middleware/authmiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res) => {
  let reservedParkingLotId = null;

  try {
    const {
      parkingLotId,
      vehicleNumber,
      bookingDate,
      startTime,
      endTime,
      hours,
    } = req.body;

    if (
      !parkingLotId ||
      !vehicleNumber ||
      !bookingDate ||
      !startTime ||
      !endTime ||
      hours === undefined
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all booking details.",
      });
    }

    if (!mongoose.isValidObjectId(parkingLotId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid parking location ID.",
      });
    }

    const normalizedVehicleNumber = vehicleNumber.trim().toUpperCase();

    if (
      normalizedVehicleNumber.length < 4 ||
      normalizedVehicleNumber.length > 20
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid vehicle number.",
      });
    }

    const parsedHours = Number(hours);

    if (
      !Number.isInteger(parsedHours) ||
      parsedHours < 1 ||
      parsedHours > 24
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking duration must be between 1 and 24 hours.",
      });
    }

    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timePattern.test(startTime) || !timePattern.test(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Time must use HH:mm format.",
      });
    }

    const startMinutes =
      Number(startTime.slice(0, 2)) * 60 +
      Number(startTime.slice(3, 5));

    const endMinutes =
      Number(endTime.slice(0, 2)) * 60 +
      Number(endTime.slice(3, 5));

    if (endMinutes <= startMinutes) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time.",
      });
    }

    if (endMinutes - startMinutes !== parsedHours * 60) {
      return res.status(400).json({
        success: false,
        message: "Duration must match start and end times.",
      });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
      return res.status(400).json({
        success: false,
        message: "Date must use YYYY-MM-DD format.",
      });
    }

    const parsedDate = new Date(`${bookingDate}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== bookingDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid booking date.",
      });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (parsedDate < today) {
      return res.status(400).json({
        success: false,
        message: "Booking date cannot be in the past.",
      });
    }

    const updatedParkingLot = await ParkingLot.findOneAndUpdate(
      {
        _id: parkingLotId,
        isActive: true,
        availableSlots: { $gte: 1 },
      },
      { $inc: { availableSlots: -1 } },
      { new: true }
    );

    if (!updatedParkingLot) {
      return res.status(409).json({
        success: false,
        message: "Parking location not found or no slots available.",
      });
    }

    reservedParkingLotId = updatedParkingLot._id;

    const totalAmount = updatedParkingLot.pricePerHour * parsedHours;

    const booking = await Booking.create({
      user: req.user.userId,
      parkingLot: updatedParkingLot._id,
      vehicleNumber: normalizedVehicleNumber,
      bookingDate: parsedDate,
      startTime,
      endTime,
      hours: parsedHours,
      totalAmount,
      bookingReference: `PS-${crypto.randomBytes(5)
        .toString("hex")
        .toUpperCase()}`,
    });

    reservedParkingLotId = null;

    return res.status(201).json({
      success: true,
      message: "Parking booked successfully!",
      booking,
      remainingSlots: updatedParkingLot.availableSlots,
    });
  } catch (error) {
    console.error("Create Booking Error:", error.message);

    if (reservedParkingLotId) {
      try {
        await ParkingLot.updateOne(
          { _id: reservedParkingLotId },
          { $inc: { availableSlots: 1 } }
        );
      } catch (restoreError) {
        console.error("Slot restore failed:", restoreError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Unable to create booking. Please try again.",
    });
  }
});

router.get("/my-bookings", authMiddleware, async (req, res) => {
  try {
    const bookings = await Booking.find({
      user: req.user.userId,
    })
      .populate("parkingLot", "name address city pricePerHour")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Fetch Bookings Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch your bookings.",
    });
  }
});

router.patch("/:id/cancel", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const booking = await Booking.findOne({
      _id: id,
      user: req.user.userId,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found.",
      });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "This booking is already cancelled.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    const parkingLot = await ParkingLot.findByIdAndUpdate(
      booking.parkingLot,
      { $inc: { availableSlots: 1 } },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully!",
      booking,
      remainingSlots: parkingLot ? parkingLot.availableSlots : null,
    });
  } catch (error) {
    console.error("Cancel Booking Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to cancel booking. Please try again.",
    });
  }
});

module.exports = router;