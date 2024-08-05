import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Follow from "../models/follow.model.js";
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js";
import mongoose from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";







const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = jwt.sign({ _id: user._id }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000 });
        const refreshToken = jwt.sign({ _id: user._id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000 });

        await User.findByIdAndUpdate(userId, { refreshToken });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token.");
    }
};



const registerUser = asyncHandler(async (req, res, next) => {
    const { email, username, password } =  req.body;
    
    if ( [email, username, password].some(field => field === "")) {
        return next(new ApiError(400, "All fields are required"));
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, "Invalid email address"));
    }

    if (password.length < 8) {
      return next(new ApiError(400, "Password must be at least 8 characters long"));
    }


    const existedUser = await  User.findOne({
        $or: [{ username }, { email }]
    })
    if(existedUser){
       return next(new ApiError(400, "User already exists"));
    }
 
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        password
    })
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if(!createdUser){
        return next(new ApiError(500, "Something went wrong while registering the user"));
    }
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    return res
    .status(201)
    .cookie("accessToken", accessToken, {
        httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
        sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
      })
    .cookie("refreshToken", refreshToken, {
        httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
        sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
      })
    .json(new ApiResponse(200, {createdUser, accessToken, refreshToken}, "User created successfully")) || ApiError(500, "Something went wrong while registering the user");
})


const loginUser = asyncHandler(async (req, res, next) => {

    // need auth middleware
    const { email, username, password } = req.body;

    if (!username && !email) {
        return next(new ApiError(400, "Username or Email is required"));
    }

    const user = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (!user) {
        return next(new ApiError(404, "User not found"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return next(new ApiError(401, "Invalid password"));
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");



    // Send response with cookies and redirect URL
    return res
        .status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
            maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
            sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
          })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
            maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
            secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
            sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
          })
        .json(new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        ));
});


const logoutUser = asyncHandler(async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req?.user?._id, {
            $unset: {
                accessToken: "",
                refreshToken: ""
            }
        }, {
            new: true
        }).lean().select("-password -refreshToken");
        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };

        return res
            .status(200)
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(new ApiResponse(200, user, "User logged out successfully"));
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
    if (newPassword.length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters long");
    }
    user.password = newPassword;
    const updatedUser = await user.save({ validateBeforeSave: false }).select("-password -refreshToken");


    return res.status(200).json(new ApiResponse(200, updatedUser, "Password changed successfully"));

})


const updateUserDetails = asyncHandler(async(req, res) => {
    const {email, username, bio} = req.body

    if (!(email || username || bio)) {
        throw new ApiError(400, "Invalid details for updation.")
    }

    if(!req.user){
        throw new ApiError(400, "Login again to update account details")
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
            
        ).select("-refreshToken -password");
    
        return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
    } catch (error) {
        throw new ApiError(500, "Something went wrong while updating account details", error)
    }
});

const updateUserAvatar = asyncHandler(async(req, res) => {

    if(!req.user){
        throw new ApiError(400, "Login again to update avatar")
    }
    const avatarLocalPath = req.file?.path       // we will inject multer middleware in route, but here we get single file only, so do req.file?.path instaed of req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath)

    if (!newAvatar.url) {

        throw new ApiError(400, "Error while uploading on avatar")
        
    }
    const user = await User.findById(req.user?._id)
    if (user.avatar) {
        await deleteFromCloudinary(user.avatar)
    }


    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: newAvatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedUser, "Avatar image updated successfully")
    )
})

const deleteUserAccount = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            throw new ApiError(400, "Login first to delete your account");
        }

        // Delete images from Cloudinary
        const blogs = await Blog.find({ author: userId });
        for (const blog of blogs) {
            if (blog.image) {
                await deleteFromCloudinary(blog.image);
            }
        }

        // Delete blogs from the database
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
        if(req.user?.avatar) await deleteFromCloudinary(req.user?.avatar);

        // Finally, delete the user
        const user = await User.findByIdAndDelete(userId);
        if (user.avatar) {
            await deleteFromCloudinary(user.avatar);
        }

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
            .json(new ApiResponse(200, user, "Account deleted successfully", '/'));

    } catch (error) {
        throw new ApiError(500, "An error occurred while deleting the account", error);
    }
});


const getUserDetails = asyncHandler(async (req, res) => {
    try {
        const requestedUserId = req.params.userId; // Changed to req.params
        const currentUserId = req.user._id;
        // console.log(requestedUserId, currentUserId);
        
        const userId = requestedUserId || currentUserId;
        const isSelf = requestedUserId == currentUserId;
        // Check if the user exists
        const userExist = await User.findById(userId).select('-password -refreshToken');
        if (!userExist) {
            throw new ApiError(404, "User not found");
        }

        const blogs = await Blog.find({ author: userId }).populate("author", "_id username avatar")

        const categoryCount = {};

        blogs.forEach(blog => {
            blog.categories.forEach(category => {
                if (categoryCount[category]) {
                    categoryCount[category]++;
                } else {
                    categoryCount[category] = 1;
                }
            });
        });
        
        // Convert the categoryCount object to an array of { category, count } objects for easier rendering
        const categoriesWithCount = Object.keys(categoryCount).map(category => {
            return { category, count: categoryCount[category] };
        });
        
          

        const userDetailsPipeline = [
            { $match: { _id: new mongoose.Types.ObjectId(String(userId)) } },
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
                    isFollowed: {
                        $in: [new mongoose.Types.ObjectId(String(currentUserId)), "$followers.follower"]
                    }
                }
            }
        ];
        const user = await User.aggregate(userDetailsPipeline).exec();
        if (!user.length) {
            throw new ApiError(404, "User details not found");
        }
        console.log({ ...user[0], ...{isSelf}, ...categoriesWithCount });
        res.render('profile', {user: { ...user[0], ...{blogs}, ...{isSelf}, ...{categoriesWithCount} }});

    } catch (error) {
        console.error("Error fetching user details:", error);
        throw new ApiError(500, "An error occurred while fetching user details", error);
    }
});



export {generateAccessAndRefreshToken, registerUser, loginUser, logoutUser, changeCurrentPassword, updateUserAvatar, updateUserDetails, deleteUserAccount, getUserDetails
}