import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Follow from "../models/follow.model.js";
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";











const generateAccessAndRefreshToken = async(userId) =>
{
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token.")
    } 
}


const home = asyncHandler(async (req, res) => {
    const blogs = [
        { id: 1, image: 'https://via.placeholder.com/300x200', title: 'Blog Title 1', description: 'Short description of the blog post. This is a brief overview.' },
        // Add more blog objects
    ];
    const events = [
        { id: 1, image: 'https://via.placeholder.com/350x200', title: 'Event Title 1', description: 'Join us for an insightful session on cutting-edge technology. Reserve your spot today!', link: 'https://example.com' },
        // Add more event objects
    ];
    const popularBlogs = [
        { id: 1, image: 'https://via.placeholder.com/300x200', title: 'Blog Title 3', description: 'Short description of the blog post. This is a brief overview.' },
        // Add more blog objects
    ];
    const statistics = {
        totalUsers: 120,
        totalBlogs: 45,
        topAuthor: 'Hitesh Rai',
        mostLikedBlog: 'Exploring the Himalayas'
    };
    res.render('home', { blogs, events, popularBlogs, statistics });
});


const registerUser = asyncHandler(async (req, res) => {
    const { email, username, password } =  req.body;
    
    if ( [email, username, password].some(field => field === "")) {
        throw new ApiError(400, "All fields are required");
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Invalid email address");
    }

    if (password.length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters long");
    }

    password = await bcrypt.hash(password, 10)

    const existedUser = await  User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
        return res.status(400).json(new ApiResponse(400, {}, "User already exists", "/login"));
    }
 
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password
    })
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user");
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, {createdUser, accessToken, refreshToken}, "User created successfully", '/')) || ApiError(500, "Something went wrong while registering the user");
})


const loginUser = asyncHandler(async (req, res) => {

    // need auth middleware
    const { email, username, password } = req.body;

    if (!username && !email) {
        throw new ApiError(400, "Username or Email is required");
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid password");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Cookie options
    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Only set secure cookie in production
        sameSite: 'Strict' // Add sameSite for added security
    };

    // Send response with cookies and redirect URL
    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully",
            "/" // Redirect URL (handle redirection on frontend if needed)
        ));
});


const logoutUser = asyncHandler(async (req, res) => {
    try {
        await User.findByIdAndUpdate(req?.user?._id, {
            $unset: {
                refreshToken: ""
            }
        }, {
            new: true
        });

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "User logged out successfully", '/'));
    } catch (error) {
        throw new ApiError(500, "Something went wrong while logging out the user");
    }
});


const changeCurrentPassword = asyncHandler( async(req, res) => {

    const {oldPassword, newPassword} = req.body;
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }
    const user = await User.findById(req.user?._id);
    if(!user){
        throw new ApiError(404, "Login again to change password");
    }
    const isOldPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if (!isOldPasswordCorrect) {
        throw new ApiError(400, "Old password is incorrect");
    }
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });


    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));

})


const updateUserDetails = asyncHandler(async(req, res) => {
    const {email, username, bio} = req.body

    if (!(email || username || bio)) {
        throw new ApiError(400, "Invalid details for updation.")
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    username: username,
                    email: email,
                    bio: bio
                }
            },
            {new: true}
            
        ).select("-password, -refreshToken")
    
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating account details", error)
    }
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path       // we will inject multer middleware in route, but here we get single file only, so do req.file?.path instaed of req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath)

    if (!newAvatar.url) {

        throw new ApiError(400, "Error while uploading on avatar")
        
    }
    const user = await User.findById(req.user?._id)
    const oldAvatar = user.avatar;
    await deleteFromCloudinary(oldAvatar);


    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: newAvatar.url
            }
        },
        {new: true}
    ).select("-password, -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
    )
})

const deleteUserAccount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;

        // Delete user's blogs
        await Blog.deleteMany({ author: userId });

        // Delete user's comments
        await Comment.deleteMany({ author: userId });

        // Delete likes associated with the user
        await Like.deleteMany({ userId });

        // Delete dislikes associated with the user
        await Dislike.deleteMany({ userId });

        // Delete follow relationships
        await Follow.deleteMany({
            $or: [{ follower: userId }, { following: userId }]
        });

        // Finally, delete the user
        await User.findByIdAndDelete(userId);

        // Clear cookies
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, {}, "Account deleted successfully", '/'));

    } catch (error) {
        throw new ApiError(500, "An error occurred while deleting the account", error);
    }
});


const getUserDetails = asyncHandler(async (req, res) => {
    try {
        const { userId: requestedUserId } = req.body;
        const currentUserId = req.user._id;

        const userId = requestedUserId || currentUserId;

        // Check if the user exists
        const user = await User.findById(userId).select('-password -refreshToken');
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const userDetailsPipeline = [
            { $match: { _id: mongoose.Types.ObjectId(userId) } },
            {
                $lookup: {
                    from: 'follows',
                    localField: '_id',
                    foreignField: 'following',
                    as: 'followers'
                }
            },
            {
                $lookup: {
                    from: 'follows',
                    localField: '_id',
                    foreignField: 'follower',
                    as: 'following'
                }
            },
            {
                $lookup: {
                    from: 'blogs',
                    localField: '_id',
                    foreignField: 'author',
                    as: 'blogs'
                }
            },
            {
                $project: {
                    username: 1,
                    bio: 1,
                    avatar: 1,
                    followersCount: { $size: "$followers" },
                    followingCount: { $size: "$following" },
                    blogsCount: { $size: "$blogs" },
                    blogs: 1,
                    isFollowed: {
                        $in: [mongoose.Types.ObjectId(currentUserId), "$followers.follower"]
                    }
                }
            }
        ];

        const userDetails = await User.aggregate(userDetailsPipeline).exec();

        if (!userDetails.length) {
            throw new ApiError(404, "User details not found");
        }

        res.status(200).json(new ApiResponse(200, userDetails[0], "User details fetched successfully"));

    } catch (error) {
        throw new ApiError(500, "An error occurred while fetching user details", error);
    }
});











export {
    home, registerUser, loginUser, logoutUser, changeCurrentPassword, updateUserAvatar, updateUserDetails, deleteUserAccount, getUserDetails
}