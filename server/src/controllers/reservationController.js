import { v4 as uuid } from "uuid";
import Event from "../models/Event.js";
import Reservation from "../models/Reservation.js";

/**
 * RESERVE SEATS
 * Uses atomic seat-based update (safe under concurrency)
 */
export const reserveSeats = async (req, res) => {
  try {
    const { partnerId, seats } = req.body;

    const limitPerReservation = Number(process.env.LIMIT_PER_RESERVATION || 10);
    const minSeats = Number(process.env.MIN_SEATS || 1);

    // Validation
    if (!partnerId || seats < minSeats || seats > limitPerReservation) {
      return res.status(400).json({ error: "Invalid seat request" });
    }

    // Atomic update: ONLY seat-based constraint
    const updatedEvent = await Event.findOneAndUpdate(
      {
        eventId: process.env.EVENT_ID,
        availableSeats: { $gte: seats }
      },
      {
        $inc: { availableSeats: -seats, version: 1 }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(409).json({ error: "Not enough seats left" });
    }

    const reservation = await Reservation.create({
      reservationId: uuid(),
      partnerId,
      seats
    });

    return res.status(201).json({
      reservationId: reservation.reservationId,
      seats,
      status: reservation.status
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * CANCEL RESERVATION
 */
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      reservationId: req.params.id
    });

    if (!reservation || reservation.status === "cancelled") {
      return res.status(404).json({ error: "Reservation not found" });
    }

    await Event.findOneAndUpdate(
      { eventId: process.env.EVENT_ID },
      { $inc: { availableSeats: reservation.seats, version: 1 } }
    );

    reservation.status = "cancelled";
    await reservation.save();

    return res.status(204).send();
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * EVENT SUMMARY
 */
export const summary = async (_, res) => {
  const event = await Event.findOne({ eventId: process.env.EVENT_ID });
  const count = await Reservation.countDocuments({ status: "confirmed" });

  return res.json({
    eventId: event.eventId,
    name: event.name,
    totalSeats: event.totalSeats,
    availableSeats: event.availableSeats,
    reservationCount: count,
    version: event.version
  });
};

/**
 * GET ALL RESERVATIONS
 */
export const getAllReservations = async (req, res) => {
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const reservations = await Reservation.find(filter)
    .sort({ createdAt: -1 })
    .select("reservationId partnerId seats status createdAt -_id");

  return res.status(200).json({
    count: reservations.length,
    reservations
  });
};
