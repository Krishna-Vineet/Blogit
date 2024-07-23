import asyncHandler from "../utils/asyncHandler.js";
import Blog  from "../models/blog.model.js";
import User from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// Create a new blog
const createBlog = asyncHandler(async (req, res) => {
    
    const { title, content, categories = [] } = req.body;
    const imageLocalPath = req.file?.path;

    const user = await User.findById(req.user._id);
    if (!user) {
        throw new ApiError(404, "Login to post blog");
    }
    if ([title, content].some(field => field === "")) {
        throw new ApiError(400, "Title and content are required");
    }
    const image = uploadOnCloudinary(imageLocalPath || 'https://i.pinimg.com/564x/2b/93/e7/2b93e7a5ab3080d4896be65adde7ac8f.jpg');
    
    const blog = await Blog.create({
        title,
        content,
        author: user._id,
        categories: Array.isArray(categories) ? categories : [categories],
        image: image.secure_url
    });

    if (!blog) {
        throw new ApiError(500, "Something went wrong while creating blog");
    }

    res.status(201).json(new ApiResponse(201,{ BlogId: blog._id }, "Blog created successfully"));

});

// Update a blog
const updateBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const { title, content, categories = [] } = req.body;

    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    if (blog.author.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this blog");
    }

    if (req.file) {
        const image = await uploadToCloudinary(req.file.path);
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

    res.status(200).json(new ApiResponse(200, { blogId: blog._id }, "Blog updated successfully"));
});

// Delete a blog
const deleteBlog = asyncHandler(async (req, res) => {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }
    res.status(200).json(new ApiResponse(200, {}, "Blog deleted successfully"));
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
    const userId = req.user?._id; // ID of the current user, if logged in

    // Fetch the blog and populate author details
    const blog = await Blog.findById(id).populate('author', 'username avatar');
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Fetch additional author details
    const author = await User.findById(blog.author._id);
    const blogCount = await Blog.countDocuments({ author: author._id });

    // Check if the current user follows the author
    let isFollowed = false;
    if (userId) {
        const follow = await Follow.findOne({ follower: userId, following: author._id });
        isFollowed = !!follow;
    }

    // Fetch likes and dislikes count
    const likesCount = await Like.countDocuments({ entityId: id, entityType: 'Blog' });
    const dislikesCount = await Dislike.countDocuments({ entityId: id, entityType: 'Blog' });

    // Fetch comments and populate their author details
    const comments = await Comment.find({ blog: id }).populate('author', 'username avatar');
    // For each comment, fetch likes and dislikes count
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

    // Prepare response data
    const responseData = {
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
                isFollowed: userId && userId.toString() !== author._id.toString() ? isFollowed : undefined
            },
            comments: commentsWithLikesDislikes
        }
    };

    res.status(200).json(new ApiResponse(200, responseData, "Blog fetched successfully"));
});


// Controller to like or unlike a blog
const likeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const userId = req.user._id;

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Check if the user has already liked the blog
    const existingLike = await Like.findOne({ blog: blogId, user: userId });
    if (existingLike) {
        // Remove the like if it exists
        await Like.findByIdAndDelete(existingLike._id);
        // Update blog's like count
        blog.likesCount -= 1;
        await blog.save();
    } else {
        // Check if the user has disliked the blog
        const existingDislike = await Dislike.findOne({ blog: blogId, user: userId });
        if (existingDislike) {
            // Remove the dislike if it exists
            await Dislike.findByIdAndDelete(existingDislike._id);
            // Update blog's dislike count
            blog.dislikesCount -= 1;
        }
        // Add the like
        await Like.create({ blog: blogId, user: userId });
        // Update blog's like count
        blog.likesCount += 1;
        await blog.save();
    }

    // Send success response
    res.status(200).json(new ApiResponse(200, {}, "Like status updated successfully"));
});


// Controller to dislike or remove dislike from a blog
const dislikeBlog = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const userId = req.user._id;

    // Find the blog
    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Check if the user has already disliked the blog
    const existingDislike = await Dislike.findOne({ blog: blogId, user: userId });
    if (existingDislike) {
        // Remove the dislike if it exists
        await Dislike.findByIdAndDelete(existingDislike._id);
        // Update blog's dislike count
        blog.dislikesCount -= 1;
        await blog.save();
    } else {
        // Check if the user has liked the blog
        const existingLike = await Like.findOne({ blog: blogId, user: userId });
        if (existingLike) {
            // Remove the like if it exists
            await Like.findByIdAndDelete(existingLike._id);
            // Update blog's like count
            blog.likesCount -= 1;
        }
        // Add the dislike
        await Dislike.create({ blog: blogId, user: userId });
        // Update blog's dislike count
        blog.dislikesCount += 1;
        await blog.save();
    }

    // Send success response
    res.status(200).json(new ApiResponse(200, {}, "Dislike status updated successfully"));
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