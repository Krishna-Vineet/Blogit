import asyncHandler from "../utils/asyncHandler.js";
import Blog  from "../models/blog.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Follow from "../models/follow.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import { isFloat64Array } from "util/types";

// Create a new blog
const createBlog = asyncHandler(async (req, res, next) => {
    
    const { title, content } = req.body;
    let { categories } = req.body;
    const imageLocalPath = req.file?.path;
    let image = "";
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ApiError(404, "Login to post blog"));
    }
    if ([title, content].some(field => field === "")) {
        return next(new ApiError(400, "Title and content are required"));
    }

    if (categories) {
        categories = JSON.parse(categories);
    } else {
        categories = [];
    }

    if (imageLocalPath) {    
        image = await uploadOnCloudinary(imageLocalPath);
        image = image.secure_url;
    }
    
    const blog = await Blog.create({
        title,
        content,
        author: user._id,
        categories,
        image
    });

    if (!blog) {
        return next(new ApiError(500, "Something went wrong while creating blog"));
    }

    res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));

});

// Update a blog
const updateBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content, categories = [] } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    if (blog.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this blog");
    }

    if (req.file) {
        if (blog.image != "") {   
            await deleteFromCloudinary(blog.image);
        }
        const image = await uploadOnCloudinary(req.file.path);
        blog.image = image.secure_url;
    }

    if (title) {
        blog.title = title;
    }
    if (content) {
        blog.content = content;
    }
    if (categories) {
        blog.categories = Array.isArray(categories) ? categories : [categories];
    }

    await blog.save();

    res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
});

// Delete a blog
const deleteBlog = asyncHandler(async (req, res) => {
    const blogId = req.params.id;

    // Delete the blog
    const blog = await Blog.findByIdAndDelete(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Delete likes related to the blog
    await Like.deleteMany({ entityType: "Blog", entityId: blogId });

    // Delete dislikes related to the blog
    await Dislike.deleteMany({ entityType: "Blog", entityId: blogId });

    // Delete comments related to the blog
    await Comment.deleteMany({ blog: blogId });
    res.status(200).json(new ApiResponse(200, blog, "Blog deleted successfully"));
});

// Get all blogs
const getAllBlogsOfUser = asyncHandler(async (req, res) => {
    // Get userId from auth middleware or request parameters
    const userId = req.user?._id || req.params.userId;

    // Check if userId is present
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Fetch all blogs for the user
    const blogs = await Blog.find({ author: userId }).sort({ createdAt: -1 });

    // Check if blogs are found
    if (!blogs) {
        throw new ApiError(404, "No blogs found for this user");
    }

    // Respond with the blogs
    res.status(200).json(new ApiResponse(200, blogs, "Blogs fetched successfully"));
});


// Get a single blog
const getBlogById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;
    
    
    
 
    const blog = await Blog.findById(id).populate('author', 'username avatar');
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }
    
    const user = await User.findById(req.user._id) ? true : false;
    const author = await User.findById(blog.author._id);
    
    const blogCount = await Blog.countDocuments({ author: author._id });


    let isFollowed = false;
    if (userId) {
        const follow = await Follow.findOne({ follower: userId, following: author._id });
        if (follow) {
            isFollowed = true;
        } else {
            isFollowed = false;
        }
    }

    const likesCount = await Like.countDocuments({ entityId: id, entityType: 'Blog' });
    const dislikesCount = await Dislike.countDocuments({ entityId: id, entityType: 'Blog' });

    const comments = await Comment.find({ blog: id }).populate('author', 'username avatar');
    const commentsWithLikesDislikes = await Promise.all(
        comments.map(async (comment) => {
            const commentLikesCount = await Like.countDocuments({ entityId: comment._id, entityType: 'Comment' });
            const commentDislikesCount = await Dislike.countDocuments({ entityId: comment._id, entityType: 'Comment' });
            return {
                ...comment.toObject(),
                likesCount: commentLikesCount,
                dislikesCount: commentDislikesCount
            };
        })
    );

    const responseData = {
        user,
        blog: {
            _id: blog._id,
            title: blog.title,
            content: blog.content,
            categories: blog.categories,
            image: blog.image,
            likesCount: likesCount,
            dislikesCount: dislikesCount,
            author: {
                _id: author._id,
                username: author.username,
                avatar: author.avatar,
                bio: author.bio,
                blogCount: blogCount,
                isSelf: userId && userId.toString() === author._id.toString() ? true : false,
                isFollowed
            },
            comments: commentsWithLikesDislikes
        }
    };


    console.log(responseData);
    res.render('blog-page', responseData);
    
});


// Controller to like or unlike a blog
const likeBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the blog
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Check if the user has already liked the blog
    const existingLike = await Like.findOne({ entityType: 'Blog', entityId: id, user: userId });
    if (existingLike) {
        // Remove the like if it exists
        await Like.findByIdAndDelete(existingLike._id);
        // Update blog's like count
        blog.likesCount -= 1;
        await blog.save();
    } else {
        // Check if the user has disliked the blog
        const existingDislike = await Dislike.findOne({ entityType: 'Blog', entityId: id, user: userId });
        if (existingDislike) {
            // Remove the dislike if it exists
            await Dislike.findByIdAndDelete(existingDislike._id);
            // Update blog's dislike count
            blog.dislikesCount -= 1;
        }
        // Add the like
        await Like.create({ entityType: 'Blog', entityId: id, user: userId });
        // Update blog's like count
        blog.likesCount += 1;
        await blog.save();
    }
    const updatedBlog = await Blog.findById(id);
    // Send success response
    res.status(200).json(new ApiResponse(200, updatedBlog, "Like status updated successfully"));
});


// Controller to dislike or remove dislike from a blog
const dislikeBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    // Find the blog
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Check if the user has already disliked the blog
    const existingDislike = await Dislike.findOne({ entityType: 'Blog', entityId: id, user: userId });
    if (existingDislike) {
        // Remove the dislike if it exists
        await Dislike.findByIdAndDelete(existingDislike._id);
        // Update blog's dislike count
        blog.dislikesCount -= 1;
        await blog.save();
    } else {
        // Check if the user has liked the blog
        const existingLike = await Like.findOne({ entityType: 'Blog', entityId: id, user: userId });
        if (existingLike) {
            // Remove the like if it exists
            await Like.findByIdAndDelete(existingLike._id);
            // Update blog's like count
            blog.likesCount -= 1;
        }
        // Add the dislike
        await Dislike.create({ entityType: 'Blog', entityId: id, user: userId });
        // Update blog's dislike count
        blog.dislikesCount += 1;
        await blog.save();
    }

    const updatedBlog = await Blog.findById(id);
    // Send success response
    res.status(200).json(new ApiResponse(200, updatedBlog, "Dislike status updated successfully"));
});

export {
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
    getAllBlogsOfUser,
    likeBlog,
    dislikeBlog
}