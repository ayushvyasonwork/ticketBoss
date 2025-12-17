import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
  reservationId: { type: String, unique: true },
  partnerId: String,
  seats: Number,
  status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" }
}, { timestamps: true });

export default mongoose.model("Reservation", reservationSchema);