require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const parkingRoutes = require("./routes/parkingRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

const app = express();

app.use(
cors({
origin: process.env.CLIENT_URL || "http://localhost:5173",
})
);

app.use(express.json({ limit: "10kb" }));

app.get("/", (req, res) => {
res.json({
success: true,
message: "Welcome to ParkSmart API!",
});
});

app.get("/api/health", (req, res) => {
res.json({
success: true,
message: "ParkSmart backend is running!",
});
});

app.use("/api/auth", authRoutes);
app.use("/api/parking", parkingRoutes);
app.use("/api/bookings", bookingRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
try {
await connectDB();

app.listen(PORT, () => {
  console.log(`ParkSmart server running on port ${PORT}`);
});

} catch (error) {
console.error("Server startup failed:", error.message);
process.exit(1);
}
};

startServer();