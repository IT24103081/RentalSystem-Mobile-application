import mongoose from "mongoose";
import Item from "../src/models/Item.js";
import dotenv from "dotenv";

dotenv.config();

const items = [
  { name: "Angle Grinder 4\"", quantity: 10, pricePerDay: 500 },
  { name: "Angle Grinder 4.5\"", quantity: 10, pricePerDay: 600 },
  { name: "Angle Grinder 7\"", quantity: 5, pricePerDay: 800 },
  { name: "Angle Grinder 7\" Heavy Duty", quantity: 3, pricePerDay: 1000 },
  { name: "Drill Machine", quantity: 15, pricePerDay: 400 },
  { name: "Re-Chargeable Drill", quantity: 3, pricePerDay: 300 },
  { name: "Hiltty (Hammer Drill)", quantity: 15, pricePerDay: 700 },
  { name: "Breaker 5 KG", quantity: 10, pricePerDay: 1500 },
  { name: "Demolizer", quantity: 5, pricePerDay: 2000 },
  { name: "Putty Mixer", quantity: 10, pricePerDay: 300 },
  { name: "Circular Saw", quantity: 10, pricePerDay: 600 },
  { name: "Marble Cutter", quantity: 5, pricePerDay: 800 },
  { name: "Sander 4\"", quantity: 3, pricePerDay: 400 },
  { name: "Sander", quantity: 5, pricePerDay: 350 },
  { name: "Orbital Sander", quantity: 3, pricePerDay: 450 },
  { name: "Mitre Saw", quantity: 4, pricePerDay: 1000 },
  { name: "Cut-off Saw", quantity: 5, pricePerDay: 900 },
  { name: "Jig Saw", quantity: 5, pricePerDay: 400 },
  { name: "Chain Saw", quantity: 3, pricePerDay: 1200 },
  { name: "Router", quantity: 2, pricePerDay: 500 },
  { name: "Planer", quantity: 3, pricePerDay: 600 },
  { name: "Electric Poker", quantity: 5, pricePerDay: 800 },
  { name: "Blower", quantity: 5, pricePerDay: 350 },
  { name: "High Pressure Washer Small", quantity: 9, pricePerDay: 600 },
  { name: "Air Compressor", quantity: 20, pricePerDay: 1000 },
  { name: "Arc Welding Plant", quantity: 15, pricePerDay: 2000 },
  { name: "Mig Welding Plant", quantity: 3, pricePerDay: 3000 },
  { name: "Tig Welding Plant", quantity: 3, pricePerDay: 4000 }
];

async function seedItems() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    // Check for existing items
    const existingCount = await Item.countDocuments();
    console.log(`Found ${existingCount} existing items`);

    // Insert items (skip if they already exist by name)
    for (const item of items) {
      const exists = await Item.findOne({ name: item.name });
      if (!exists) {
        await Item.create(item);
        console.log(`✓ Added: ${item.name}`);
      } else {
        console.log(`✗ Skipped (exists): ${item.name}`);
      }
    }

    const finalCount = await Item.countDocuments();
    console.log(`\nTotal items in database: ${finalCount}`);
    console.log("Seeding complete!");

  } catch (error) {
    console.error("Error seeding items:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedItems();
