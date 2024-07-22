import asyncHandler from "../utils/asyncHandler.js";
import Blog  from "../models/blog.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";

// Create a new blog
export const createBlog = asyncHandler(async (req, res) => {
    const { title, content, categories, image } = req.body;
    const blog = new Blog({
        title,
        author: req.user._id,
        content,
        categories,
        image
    });
    await blog.save();
    res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));
});

// Get all blogs
export const getBlogs = asyncHandler(async (req, res) => {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, blogs, "Blogs fetched successfully"));
});

// Get a single blog
export const getBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findById(req.params.id).populate('author', 'username avatar');
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }
    res.status(200).json(new ApiResponse(200, blog, "Blog fetched successfully"));
});

// Update a blog
export const updateBlog = asyncHandler(async (req, res) => {
    const { title, content, categories, image } = req.body;
    const blog = await Blog.findByIdAndUpdate(req.params.id, {
        title,
        content,
        categories,
        image
    }, { new: true });
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }
    res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
});

// Delete a blog
export const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }
    res.status(200).json(new ApiResponse(200, {}, "Blog deleted successfully"));
});
