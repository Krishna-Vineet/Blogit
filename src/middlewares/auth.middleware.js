import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { generateAccessAndRefreshToken } from "../controllers/user.controller.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken;


    if (accessToken) {
        try {
            const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken._id).select("-password -refreshToken");

            if (!user) {
                return next(new ApiError(401, "Invalid access token"));
            }

            req.user = user;
            return next();
        } catch (error) {
            if (error.name === "TokenExpiredError" && refreshToken) {
                try {
                    const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    const user = await User.findById(decodedRefreshToken._id).select("-password");

                    if (!user) {
                        throw new ApiError(401, "Invalid refresh token");
                    }

                    // Generate new access and refresh tokens
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

                    // Save new refresh token to user
                    user.refreshToken = newRefreshToken;
                    await user.save({ validateBeforeSave: false });

                    // Set new tokens in cookies
                    res.cookie("accessToken", newAccessToken, {
                        httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
                        maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
                        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
                        sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
                      });
                    res.cookie("refreshToken", newRefreshToken, {
                        httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
                        maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
                        secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
                        sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
                      });

                    req.user = user;
                    return next();
                } catch (refreshError) {
                    req.user = null;
                    return next();
                }
            } else {
                req.user = null;
                return next();
            }
        }
    } else if (refreshToken) {
        try {
            const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            const user = await User.findById(decodedRefreshToken._id).select("-password");

            if (!user) {
                throw new ApiError(401, "Invalid refresh token");
            }

            // Generate new access and refresh tokens
            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id);

            // Save new refresh token to user
            user.refreshToken = newRefreshToken;
            await user.save({ validateBeforeSave: false });

            // Set new tokens in cookies
            res.cookie("accessToken", newAccessToken, {
                httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
                maxAge: parseInt(process.env.ACCESS_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
                secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
                sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
              });
            res.cookie("refreshToken", newRefreshToken, {
                httpOnly: true,               // Prevents client-side JavaScript from accessing the cookie
                maxAge: parseInt(process.env.REFRESH_TOKEN_EXPIRY) * 1000, // Sets the cookie expiration time
                secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
                sameSite: 'Strict'            // Helps prevent CSRF attacks by ensuring the cookie is only sent with same-site requests
              });
              
            req.user = user;
            return next();
        } catch (error) {
            req.user = null;
            return next();
        }
    } else {
        req.user = null;
        return next();
    }
});

export default verifyJWT;
