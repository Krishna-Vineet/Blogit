import express from "express";
import {
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
    getAllBlogsOfUser,
    getBlogsByCategory,
    likeBlog,
    dislikeBlog,
    incrementViewCount,
    incrementShareCount,
    getEditPage
} from "../controllers/blog.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post('/create', verifyJWT, upload.single('image'), createBlog);
router.patch('/update/:id', verifyJWT, upload.single('image'), updateBlog);
router.delete('/delete/:id', verifyJWT, deleteBlog);
router.get('/view/:id', verifyJWT, getBlogById);
router.get('/user/:userId', verifyJWT, getAllBlogsOfUser);  // not used
router.get('/category/:category', verifyJWT, getBlogsByCategory);
router.post('/like/:id', verifyJWT, likeBlog);
router.post('/dislike/:id', verifyJWT, dislikeBlog);
router.post('/incrementViewCount/:id', incrementViewCount);
router.post('/incrementShareCount/:id', incrementShareCount);
router.get('/editPage/:id', verifyJWT, getEditPage);

export default router;
