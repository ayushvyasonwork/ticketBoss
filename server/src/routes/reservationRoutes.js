import express from "express";
import { reserveSeats, cancelReservation, summary ,
  getAllReservations} from "../controllers/reservationController.js";

const router = express.Router();
router.post("/reservations", reserveSeats);
router.delete("/reservations/:id", cancelReservation);
router.get("/reservations", summary);
router.get("/reservations/all", getAllReservations);

export default router;