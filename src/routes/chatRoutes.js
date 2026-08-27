import { Router } from "express";
import { sendMessage } from "../controllers/chatController.js";

const router = Router();

router.post("/chat", sendMessage);

export default router;
