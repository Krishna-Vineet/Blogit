import express from "express";
import { toggleFollow } from "../controllers/follow.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/:targetUserId', verifyJWT, toggleFollow);

export default router;
