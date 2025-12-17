import express from "express";
import { resetEventData } from "../controllers/adminController.js";

const router = express.Router();

router.post("/admin/reset", resetEventData);

export default router;
