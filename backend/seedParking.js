require("dotenv").config();

const mongoose = require("mongoose");
const ParkingLot = require("./models/ParkingLot");

const parkingLots = [
{
name: "City Center Parking",
address: "Near City Center Market",
city: "Aligarh",
totalSlots: 50,
availableSlots: 32,
pricePerHour: 30,
amenities: ["CCTV", "Security", "Lighting"],
image: "",
},
{
name: "Railway Station Parking",
address: "Near Railway Station Entrance",
city: "Aligarh",
totalSlots: 80,
availableSlots: 45,
pricePerHour: 20,
amenities: ["CCTV", "Security"],
image: "",
},
{
name: "Mall Smart Parking",
address: "Near Shopping Mall",
city: "Aligarh",
totalSlots: 100,
availableSlots: 60,
pricePerHour: 40,
amenities: ["CCTV", "Security", "EV Charging", "Lighting"],
image: "",
},
];

async function seedParking() {
try {
await mongoose.connect(process.env.MONGO_URI);

// Prevent duplicate sample locations on repeated runs
for (const lot of parkingLots) {
  await ParkingLot.findOneAndUpdate(
    { name: lot.name, city: lot.city },
    { $setOnInsert: lot },
    { upsert: true, new: true }
  );
}

console.log("Parking sample data added successfully!");

const allLots = await ParkingLot.find({ city: "Aligarh" });
console.log(`Total Aligarh parking locations: ${allLots.length}`);

} catch (error) {
console.error("Seeding failed:", error.message);
process.exitCode = 1;
} finally {
await mongoose.disconnect();
}
}

seedParking();