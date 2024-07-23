import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/user.model.js";
import Follow from "../models/follow.model.js";

// Controller to toggle follow status
const toggleFollow = asyncHandler(async (req, res) => {
    const { userId: targetUserId } = req.params;
    const currentUserId = req.user._id;

    // Ensure the user is not trying to follow/unfollow themselves
    if (targetUserId === currentUserId.toString()) {
        throw new ApiError(400, "You cannot follow/unfollow yourself");
    }

    // Check if the target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
        throw new ApiError(404, "User not found");
    }

    // Check if the current user is already following the target user
    const existingFollow = await Follow.findOne({ follower: currentUserId, following: targetUserId });

    if (existingFollow) {
        // If already following, unfollow
        await Follow.findByIdAndDelete(existingFollow._id);

        // Update follow counts
        targetUser.followersCount -= 1;
        await targetUser.save();

        const currentUser = await User.findById(currentUserId);
        currentUser.followingCount -= 1;
        await currentUser.save();

        return res.status(200).json(new ApiResponse(200, { isFollowed: false }, "User unfollowed successfully"));
    } else {
        // If not following, follow
        await Follow.create({ follower: currentUserId, following: targetUserId });

        // Update follow counts
        targetUser.followersCount += 1;
        await targetUser.save();

        const currentUser = await User.findById(currentUserId);
        currentUser.followingCount += 1;
        await currentUser.save();

        return res.status(200).json(new ApiResponse(200, { isFollowed: true }, "User followed successfully"));
    }
});

export { toggleFollow }