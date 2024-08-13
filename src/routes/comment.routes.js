import express from "express";
import {
    addComment,
    editComment,
    deleteComment,
    likeComment,
    dislikeComment,
    getComments
} from "../controllers/comment.controller.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/add/:blogId', verifyJWT, addComment);
router.patch('/edit/:commentId', verifyJWT, editComment);
router.post('/like/:commentId', verifyJWT, likeComment);
router.post('/dislike/:commentId', verifyJWT, dislikeComment);
router.delete('/delete/:commentId', verifyJWT, deleteComment);
router.get('/get/:blogId', verifyJWT, getComments);

export default router;
