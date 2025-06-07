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
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import Otp from "../models/otp.model.js";







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



const sendOtp = asyncHandler(async (req, res, next) => {
    const { email, type } = req.body;

    if (!email) {
        return next(new ApiError(400, "Email is required"));
    }
    const user = await User.findOne({ email });
    if (type === 'register' && user) {
        return next(new ApiError(400, "User with this email already exists"));
    }
    try {
        // Generate a verification code
        const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
        const expirationTime = Date.now() + 300000;
        await Otp.create({ otp: verificationCode, email, expirationTime });

        let htmlContent, subject;
        if (type === 'register') {
             htmlContent = `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ccc; border-radius: 10px; padding: 25px; background-color: #f9f9f9; color: #333;">
            <h2 style="color: #222; text-align: center; margin-bottom: 20px;">🔐OTP for Email Verification</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
                Hello, <br/><br/>
                We received a request to verify your email address: <strong style="color: #000;">${email}</strong><br/>
                To continue with your registration, please use the verification code below:
                </p>
                
            <div style="background-color: #1a1a1a; color: #f5ba1a; font-size: 24px; font-weight: bold; text-align: center; padding: 15px 0; border-radius: 8px; margin: 20px 0;">
            ${verificationCode}
            </div>
            
            <p style="font-size: 15px; color: #555; line-height: 1.5;">
            This code will expire in <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; font-size: 13px; color: #999; margin-top: 25px;">
            — Blogit Registration System
            </div>
        </div>
        `
            subject = "OTP for Email Verification";
        } else if (type === 'resetPassword') {
            htmlContent = `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ccc; border-radius: 10px; padding: 25px; background-color: #f9f9f9; color: #333;">
            <h2 style="color: #222; text-align: center; margin-bottom: 20px;">🔐OTP for Password Reset</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
                Hello, <br/><br/>
                We received a request to reset the password for your email: <strong style="color: #000;">${email}</strong><br/>
                To continue with the password reset process, please use the verification code below:
                </p>
                
            <div style="background-color: #1a1a1a; color: #f5ba1a; font-size: 24px; font-weight: bold; text-align: center; padding: 15px 0; border-radius: 8px; margin: 20px 0;">
            ${verificationCode}
            </div>
            
            <p style="font-size: 15px; color: #555; line-height: 1.5;">
            This code will expire in <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; font-size: 13px; color: #999; margin-top: 25px;">
            — Blogit Password Reset System
            </div>
        </div>
        `
            subject = "OTP for Password Reset";
        } else {
            htmlContent = `
            <div style="max-width: 600px; margin: auto; font-family: Arial, sans-serif; border: 1px solid #ccc; border-radius: 10px; padding: 25px; background-color: #f9f9f9; color: #333;">
            <h2 style="color: #222; text-align: center; margin-bottom: 20px;">🔐OTP for Email Verification</h2>
            
            <p style="font-size: 16px; line-height: 1.6;">
                Hello, <br/><br/>
                We received a request to generate OTP for email address: <strong style="color: #000;">${email}</strong><br/>
                To continue, please use the verification code below:
                </p>
                
            <div style="background-color: #1a1a1a; color: #f5ba1a; font-size: 24px; font-weight: bold; text-align: center; padding: 15px 0; border-radius: 8px; margin: 20px 0;">
            ${verificationCode}
            </div>
            
            <p style="font-size: 15px; color: #555; line-height: 1.5;">
            This code will expire in <strong>5 minutes</strong>. If you did not request this, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; font-size: 13px; color: #999; margin-top: 25px;">
            — Blogit Verification System
            </div>
            `
            subject = "OTP request";
        }
        // Send verification code to user's email
        await sendEmail({
            to: email,
            subject: subject,
            html: htmlContent
        });
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while generating OTP:" + error.message));
    }
    res.status(200).json(new ApiResponse(200, "OTP sent to your email"));
});


const registerUser = asyncHandler(async (req, res, next) => {
    const { email, username, password, otp } =  req.body;
    
    if ( [email, username, password, otp].some(field => field === "")) {
        return next(new ApiError(400, "All fields are required"));
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, "Invalid email address"));
    }

    if (password.length < 8) {
      return next(new ApiError(400, "Password must be at least 8 characters long"));
    }

    const usernameExist = await User.findOne({ username });
    if (usernameExist) {
        return next(new ApiError(400, "Username already exists, try another one."));
    }

    const existedUser = await  User.findOne({ email });
    if(existedUser){
       return next(new ApiError(400, "User with this email already exists"));
    }

    const userOtp = await Otp.findOne({ otp, email });
    if(!userOtp){
        return next(new ApiError(400, "Invalid OTP"));
    }

    if(userOtp.expirationTime < Date.now()){
        return next(new ApiError(400, "OTP has expired, please request a new one"));
    }

    await Otp.findByIdAndDelete(userOtp._id);

    const avatar = await uploadOnCloudinary(`https://ui-avatars.com/api/?name=${username}&size=512&background=random&length=1&rounded=true`);

    
    const user = await User.create({
        username: username.trim().toLowerCase(),
        displayName: username,
        email,
        password,
        avatar: avatar.secure_url
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
        return next(new ApiError(404, "Invalid username or email"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return next(new ApiError(401, "Incorrect password"));
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


const updateUserDetails = asyncHandler(async (req, res, next) => {
    const { username, bio, instagram, facebook, password } = req.body;

    if (!password) {
        return next(new ApiError(400, "Password is required"));
    }

    if (!username && !bio && !instagram && !facebook) {
        return next(new ApiError(400, "No details to update"));
    }
    if (!username) {
        return next(new ApiError(400, "Username is required"));
    }

    const user = await User.findById(req.user?._id);

    if (!user) {
        return next(new ApiError(404, "Login to update account details"));
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        return next(new ApiError(401, "Incorrect password"));
    }

    try {
        const user = await User.findByIdAndUpdate(
            req.user._id,
            {
                $set: {
                    username: username.trim().toLowerCase(),
                    displayName: username,
                    bio: bio,
                    instagram: instagram,
                    facebook: facebook
                }
            },
            { new: true }
        ).select("-refreshToken -password");

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Account details updated successfully"));
    } catch (error) {
        console.error(error); // Log any server-side errors
        throw new ApiError(500, "Something went wrong while updating account details", error);
    }
});


const updateUserAvatar = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        throw new ApiError(400, "Login again to update avatar");
    }


    const avatarLocalPath = req.file?.path; // We will inject multer middleware in the route, but here we get single file only, so do req.file?.path instead of req.files?.coverImage[0]?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const newAvatar = await uploadOnCloudinary(avatarLocalPath);

    if (!newAvatar.url) {
        throw new ApiError(400, "Error while uploading avatar to Cloudinary");
    }

    const user = await User.findById(req.user?._id);
    if (user.avatar) {
        await deleteFromCloudinary(user.avatar);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: newAvatar.url
            }
        },
        { new: true }
    ).select("-password -refreshToken");

    return res.status(200).json(new ApiResponse(200, updatedUser, "Avatar image updated successfully"));
});


const deleteUserAccount = asyncHandler(async (req, res, next) => {
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


const getUserDetails = asyncHandler(async (req, res, next) => {
    try {
        const requestedUserId = req.params.userId; // Changed to req.params
        const currentUserId = req?.user?._id || null;
        
        const userId = requestedUserId;        
        const isSelf = requestedUserId == currentUserId;
        // Check if the user exists
        const userExist = await User.findById(userId).select('-password -refreshToken');
        if (!userExist) {
            throw new ApiError(404, "User not found");
        }

        const blogs = await Blog.aggregate([
            {
              $match: { author: new mongoose.Types.ObjectId(String(userId)) } // Match blogs authored by the user
            },
            {
              $lookup: {
                from: 'comments', // The collection to join with
                localField: '_id', // The field from the Blog collection
                foreignField: 'blog', // The field from the Comment collection
                as: 'comments' // The field to add the joined results
              }
            },
            {
              $addFields: {
                commentCount: { $size: '$comments' } // Add a new field 'commentCount' with the number of comments
              }
            },
            {
              $unset: 'comments' // Optionally remove the 'comments' field if you don't need the full comment data
            },
            {
              $lookup: {
                from: 'users', // The collection to join with for author details
                localField: 'author',
                foreignField: '_id',
                as: 'authorDetails' // The field to add the joined results
              }
            },
            {
              $unwind: '$authorDetails' // Unwind the authorDetails array to a single object
            },
            {
              $project: {
                title: 1, // Include the title field
                content: 1, // Include the content field
                categories: 1, // Include the categories field
                image: 1, // Include the image field
                likesCount: 1, // Include the likesCount field
                dislikesCount: 1, // Include the dislikesCount field
                viewsCount: 1, // Include the viewsCount field
                shareCount: 1, // Include the shareCount field
                edited: 1, // Include the edited field
                createdAt: 1, // Include the createdAt field
                updatedAt: 1, // Include the updatedAt field
                __v: 1, // Include the __v field
                commentCount: 1, // Include the newly added commentCount field
                'author._id': '$authorDetails._id', // Include the author _id
                'author.displayName': '$authorDetails.displayName', // Include the author displayName
                'author.avatar': '$authorDetails.avatar' // Include the author avatar
              }
            }
          ]);

       

        const categoryCount = {};

        blogs.forEach( async blog =>{
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
        

        let userDetailsPipeline = [];
        if(currentUserId){       
            userDetailsPipeline = [
                { $match: { _id: new mongoose.Types.ObjectId(String(userId)) } },
                {
                    $lookup: {
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'isFollowed',
                        as: 'followers'
                    }
                },
                {
                    $lookup: {
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'hasFollowed',
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
                        _id: 1,
                        displayName: 1,
                        bio: 1,
                        avatar: 1,
                        instagram: 1,
                        facebook: 1,
                        x: 1,
                        followersCount: { $size: "$followers" },
                        followingCount: { $size: "$following" },
                        blogsCount: { $size: "$blogs" },
                        isFollowed: {
                            $in: [new mongoose.Types.ObjectId(String(currentUserId)), "$followers.hasFollowed"]
                        }
                    }
                }
            ];
        } else {
            userDetailsPipeline = [
                { $match: { _id: new mongoose.Types.ObjectId(String(userId)) } },
                {
                    $lookup: {
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'hasFollowed',
                        as: 'following'
                    }
                },
                {
                    $lookup: {
                        from: 'follows',
                        localField: '_id',
                        foreignField: 'isFollowed',
                        as: 'followers'
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
                        _id: 1,
                        displayName: 1,
                        bio: 1,
                        avatar: 1,
                        instagram: 1,
                        facebook: 1,
                        x: 1,
                        followersCount: { $size: "$followers" },
                        followingCount: { $size: "$following" },
                        blogsCount: { $size: "$blogs" },
                    }
                }
            ];
        }
        
        const user = await User.aggregate(userDetailsPipeline).exec();
        
        if (!user.length) {
            throw new ApiError(404, "User details not found");
        }
        
        res.render('profile', {user: { ...user[0], ...{blogs}, ...{isSelf}, ...{categoriesWithCount} }, currentUserId});

    } catch (error) {
        console.error("Error fetching user details:", error);
        throw new ApiError(500, "An error occurred while fetching user details", error);
    }
});

const resetPassword = asyncHandler(async (req, res, next) => {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if(!user){
        return next(new ApiError(400, "User with this email does not exist"));
    }

    const userOtp = await Otp.findOne({ otp, email });
    if(!userOtp){
        return next(new ApiError(400, "Invalid OTP"));
    }

    if(userOtp.expirationTime < Date.now()){
        return next(new ApiError(400, "OTP has expired, please request a new one"));
    }

    if (newPassword.length < 8) {
        return next (new ApiError(400, "Password must be at least 8 characters long"));
    }

    try {
        await Otp.findByIdAndDelete(userOtp._id);

    // Update the user's password
    user.password = newPassword;

    // Save the updated user information
    await user.save();

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict'
    };
    // Respond with success
    return res.
    status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, null, "Password reset successfully"));

    } catch (error) {
        console.error("Error resetting password:", error);
        throw new ApiError(500, "An error occurred while resetting password", error);
    }
});

const changeEmail = asyncHandler(async (req, res, next) => {
    const { newEmail, otp } = req.body;
    
    const user = await User.findById(req.user?._id);
    if(!user){
        return next(new ApiError(400, "Login to change email"));
    }
    
    const userOtp = await Otp.findOne({ otp, email : newEmail });

    
    if(!userOtp){
        return next(new ApiError(400, "Invalid OTP"));
    }

    if(userOtp.expirationTime < Date.now()){
        return next(new ApiError(400, "OTP has expired, please request a new one"));
    }


    try {
        await Otp.findByIdAndDelete(userOtp._id);
        // Update the user's email
        const updatedUser = await User.findByIdAndUpdate(req.user?._id, { email: newEmail }, { new: true });
        
        return res.status(200).json(new ApiResponse(200, null, "Email changed successfully"));
    } catch (error) {
        console.error("Error changing email:", error);
        throw new ApiError(500, "An error occurred while changing email", error);
    }
});



export {generateAccessAndRefreshToken, registerUser, loginUser, logoutUser, updateUserAvatar, updateUserDetails, deleteUserAccount, getUserDetails, sendOtp, resetPassword, changeEmail
}