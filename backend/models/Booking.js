const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
{
user: {
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true,
},

parkingLot: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "ParkingLot",
  required: true,
},

vehicleNumber: {
  type: String,
  required: true,
  trim: true,
  uppercase: true,
},

bookingDate: {
  type: Date,
  required: true,
},

startTime: {
  type: String,
  required: true,
},

endTime: {
  type: String,
  required: true,
},

hours: {
  type: Number,
  required: true,
  min: 1,
  max: 24,
},

totalAmount: {
  type: Number,
  required: true,
  min: 0,
},

status: {
  type: String,
  enum: ["confirmed", "cancelled"],
  default: "confirmed",
},

bookingReference: {
  type: String,
  unique: true,
  required: true,
},

},
{ timestamps: true }
);

bookingSchema.index({ user: 1, createdAt: -1 });
bookingSchema.index({ parkingLot: 1, bookingDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);