const mongoose = require("mongoose");

const parkingLotSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    totalSlots: {
      type: Number,
      required: true,
      min: 1,
    },
    availableSlots: {
      type: Number,
      required: true,
      min: 0,
    },
    pricePerHour: {
      type: Number,
      required: true,
      min: 0,
    },
    amenities: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParkingLot", parkingLotSchema);