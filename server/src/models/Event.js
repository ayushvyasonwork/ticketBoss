import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true },
  name: String,
  totalSeats: Number,
  availableSeats: Number,
  version: { type: Number, default: 0 }
});

export default mongoose.model("Event", eventSchema);