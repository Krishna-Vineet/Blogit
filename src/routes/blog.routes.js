import express from "express";
import { createBlog, getBlogs, getBlog, updateBlog, deleteBlog } from "../controllers/blog.controller.js";
import verifyJWT from "../middleware/authMiddleware.js";

const router = express.Router();

router.route('/')
    .post(verifyJWT, createBlog) // Create a new blog
    .get(getBlogs); // Get all blogs

router.route('/:id')
    .get(getBlog) // Get a single blog
    .put(verifyJWT, updateBlog) // Update a blog
    .delete(verifyJWT, deleteBlog); // Delete a blog

export default router;
