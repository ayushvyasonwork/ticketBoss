import Event from "../models/Event.js";
import Reservation from "../models/Reservation.js";

export const resetEventData = async (req, res) => {
  const secret = req.headers["x-admin-secret"];

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return res.status(403).json({ error: "Unauthorized reset attempt" });
  }
  const event = await Event.findOne({ eventId: process.env.EVENT_ID });
  if (!event) {
    return res.status(404).json({ error: "Event not found" });
  }
  // Delete all reservations
  await Reservation.deleteMany({});
  console.log("All reservations deleted.");
  console.log("available seats are ", process.env.AVAILABLE_SEATS);
  // Reset event state
  event.totalSeats = process.env.TOTAL_SEATS;
  event.availableSeats = process.env.AVAILABLE_SEATS;
  event.version = process.env.VERSION;
  await event.save();
  return res.status(200).json({
    message: "Event and reservations reset successfully",
    totalSeats: event.totalSeats,
    availableSeats: event.availableSeats,
    version: event.version,
  });
};
