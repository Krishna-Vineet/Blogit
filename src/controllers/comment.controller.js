import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import Blog from "../models/blog.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Comment from "../models/comment.model.js";

// Controller to add a comment to a blog
const addComment = asyncHandler(async (req, res) => {
    const { blogId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    // Check if text is provided
    if (!text) {
        throw new ApiError(400, "Comment text is required");
    }

    // Check if the blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Create a new comment
    const comment = await Comment.create({
        content: text,
        author: userId,
        blog: blogId
    });

    // Populate the comment with the necessary fields
    const populatedComment = await Comment.findById(comment._id)
        .populate('author', 'username avatar')
        .lean();

    // Send response with the created comment
    res.status(201).json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

// Controller to edit a comment
const editComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Validate that text is provided
    if (!text) {
        throw new ApiError(400, "Comment text is required");
    }

    // Find the comment by ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the logged-in user is the author of the comment
    if (comment.author.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to edit this comment");
    }

    // Update the comment
    comment.content = text;
    await comment.save();

    // Fetch like and dislike counts from separate models
    const likeCount = await Like.countDocuments({ entityType: "Comment", entityId: commentId });
    const dislikeCount = await Dislike.countDocuments({ entityType: "Comment", entityId: commentId });

    // Populate the comment with the necessary fields for the response
    const updatedComment = await Comment.findById(commentId)
        .populate('author', 'username avatar')
        .lean();

    // Add like and dislike counts to the response
    updatedComment.likes = likeCount;
    updatedComment.dislikes = dislikeCount;

    // Send response with the updated comment
    res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Find the comment by ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the logged-in user is the author of the comment or an admin
    if (comment.author.toString() !== userId.toString() && !req.user.isAdmin) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    // Delete the comment
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    // Delete associated likes and dislikes
    await Like.deleteMany({ entityType: "Comment", entityId: commentId });
    await Dislike.deleteMany({ entityType: "Comment", entityId: commentId });

    // Send success response
    res.status(200).json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

// Controller to like or unlike a comment
const likeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user has already liked the comment
    const existingLike = await Like.findOne({ entityType: "Comment", entityId: commentId, user: userId });
    if (existingLike) {
        // Remove the like if it exists
        await Like.findByIdAndDelete(existingLike._id);
        // Update comment's like count
        comment.likesCount -= 1;
        await comment.save();
    } else {
        // Check if the user has disliked the comment
        const existingDislike = await Dislike.findOne({ entityType: "Comment", entityId: commentId, user: userId });
        if (existingDislike) {
            // Remove the dislike if it exists
            await Dislike.findByIdAndDelete(existingDislike._id);
            // Update comment's dislike count
            comment.dislikesCount -= 1;
        }
        // Add the like
        await Like.create({ entityType: "Comment", entityId: commentId, user: userId });
        // Update comment's like count
        comment.likesCount += 1;
        await comment.save();
    }
    const updatedComment = await Comment.findById(commentId);
    // Send success response
    res.status(200).json(new ApiResponse(200, updatedComment, "Like status updated successfully"));
});


// Controller to dislike or remove dislike from a comment
const dislikeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;

    // Find the comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Check if the user has already disliked the comment
    const existingDislike = await Dislike.findOne({ entityType: "Comment", entityId: commentId, user: userId });
    if (existingDislike) {
        // Remove the dislike if it exists
        await Dislike.findByIdAndDelete(existingDislike._id);
        // Update comment's dislike count
        comment.dislikesCount -= 1;
        await comment.save();
    } else {
        // Check if the user has liked the comment
        const existingLike = await Like.findOne({ entityType: "Comment", entityId: commentId, user: userId });
        if (existingLike) {
            // Remove the like if it exists
            await Like.findByIdAndDelete(existingLike._id);
            // Update comment's like count
            comment.likesCount -= 1;
        }
        // Add the dislike
        await Dislike.create({ entityType: "Comment", entityId: commentId, user: userId });
        // Update comment's dislike count
        comment.dislikesCount += 1;
        await comment.save();
    }
    const updatedComment = await Comment.findById(commentId);

    // Send success response
    res.status(200).json(new ApiResponse(200, updatedComment, "Dislike status updated successfully"));
});

export {
    addComment, editComment, deleteComment, likeComment, dislikeComment
}