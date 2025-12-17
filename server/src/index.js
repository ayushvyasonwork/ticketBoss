import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import Event from "./models/Event.js";
import routes from "./routes/reservationRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";


dotenv.config();
await connectDB();

const app = express();
app.use(express.json());

const seedEvent = async () => {
  const exists = await Event.findOne({ eventId: process.env.EVENT_ID });
  if (!exists) {
    await Event.create({
      eventId: process.env.EVENT_ID,
      name: process.env.EVENT_NAME,
      totalSeats: process.env.TOTAL_SEATS,
      availableSeats: process.env.AVAILABLE_SEATS,
      version: process.env.VERSION,
    });
  }
};

await seedEvent();

app.use("/api", routes);
app.use("/api", adminRoutes);

app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
);