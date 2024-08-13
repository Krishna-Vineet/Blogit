import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import Blog from "../models/blog.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Comment from "../models/comment.model.js";
import { response } from "express";

// Controller to add a comment to a blog
const addComment = asyncHandler(async (req, res, next) => {
    const { blogId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!userId) {
        return next (new ApiError(401, "Unauthorized"));
    }
    // Check if text is provided
    if (!text) {
        return next (new ApiError(400, "Comment text is required"));
    }

    // Check if the blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
        return next (new ApiError(404, "Blog not found"));
    }

    // Create a new comment
    const comment = await Comment.create({
        content: text,
        author: userId,
        blog: blogId
    });

    // Populate the comment with the necessary fields
    const populatedComment = await Comment.findById(comment._id)
        .populate('author')
        .lean();

    // Send response with the created comment
    console.log({...populatedComment, ...{userId}});
    
    res.status(201).json(new ApiResponse(201, populatedComment, "Comment added successfully"));
});

// Controller to edit a comment
const editComment = asyncHandler(async (req, res, next) => {
    const { commentId } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    // Validate that text is provided
    if (!text) {
        return next (new ApiError(400, "Comment text is required"));
    }

    // Find the comment by ID
    const comment = await Comment.findById(commentId);
    if (!comment) {
        return next (new ApiError(404, "Comment not found"));
    }

    // Check if the logged-in user is the author of the comment
    if (comment.author.toString() !== userId.toString()) {
        return next (new ApiError(403, "You are not authorized to edit this comment"));
    }

    // Update the comment
    comment.content = text;
    await comment.save();


    // Populate the comment with the necessary fields for the response
    const updatedComment = await Comment.findById(commentId);

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
    let likedByUser;

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
        likedByUser = false;
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
        likedByUser = true;
    }
    const updatedComment = await Comment.findById(commentId);
    const response = {
        likesCount : updatedComment.likesCount,
        dislikesCount : updatedComment.dislikesCount,
        likedByUser
    }
    // console.log(response);
    
    // Send success response
    res.status(200).json(new ApiResponse(200, response, "Like status updated successfully"));
});


// Controller to dislike or remove dislike from a comment
const dislikeComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user._id;
    let dislikedByUser;
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
        dislikedByUser = false;
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
        dislikedByUser = true;
    }
    const updatedComment = await Comment.findById(commentId);
    const response = {
        likesCount : updatedComment.likesCount,
        dislikesCount : updatedComment.dislikesCount,
        dislikedByUser
    }

    // console.log(response);
    
    // Send success response
    res.status(200).json(new ApiResponse(200, response, "Dislike status updated successfully"));
});




const getComments = asyncHandler(async (req, res, next) => {
  try {
    const userId = req?.user?._id; // Fetching the logged-in user's ID
    const { blogId } = req.params; // Extracting the blogId from request parameters
    
    // Fetch all comments for the specified blog, sorted by creation date
    let comments = await Comment.find({ blog: blogId })
                                .sort({ updatedAt: -1 })
                                .populate("author", "username avatar"); // Populate the author's details

    if (userId) {
      // Iterate over each comment and determine if the user liked or disliked it
      comments = await Promise.all(
        comments.map(async (comment) => {
          // Check if the user has liked this comment
          const likedByUser = !!(await Like.findOne({ user: userId, entityId: comment._id, entityType: 'Comment' }));

          // Check if the user has disliked this comment
          const dislikedByUser = !!(await Dislike.findOne({ user: userId, entityId: comment._id, entityType: 'Comment' }));
          
          // Return the comment object with added likedByUser and dislikedByUser fields
          return {
            ...comment.toObject(), // Convert the Mongoose document to a plain JS object
            likedByUser,
            dislikedByUser
          };
        })
      );
    }

    console.log(comments);
    
    // Send the comments as the response
    res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully"));
  } catch (error) {
    // Handle any errors during the process
    return next(new ApiError(500, 'Error fetching comments', error));
  }
});

export default getComments;

  





export {
    addComment, editComment, deleteComment, likeComment, dislikeComment, getComments
}