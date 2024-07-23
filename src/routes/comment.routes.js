import express from "express";
import {
    addComment,
    editComment,
    deleteComment,
    likeComment,
    dislikeComment
} from "../controllers/comment.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/add/:blogId', verifyJWT, addComment);
router.patch('/edit/:id', verifyJWT, editComment);
router.delete('/delete/:id', verifyJWT, deleteComment);
router.post('/like/:id', verifyJWT, likeComment);
router.post('/dislike/:id', verifyJWT, dislikeComment);

export default router;
