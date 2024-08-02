import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiErrors.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { generateAccessAndRefreshToken } from "../controllers/user.controller.js";

const verifyJWT = asyncHandler(async (req, res, next) => {
    // console.log("Verifying JWT");
    const accessToken = req.cookies?.accessToken || req.header("Authorization")?.split(" ")[1];
    const refreshToken = req.cookies?.refreshToken;

    // console.log("Access token:", accessToken);
    // console.log("Refresh token:", refreshToken);

    if (accessToken) {
        try {
            // Verify access token
            // console.log("Access token found, verifying...");
            const decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
            const user = await User.findById(decodedToken._id).select("-password -refreshToken");

            if (!user) {
                // console.log("Invalid access token: user not found");
                return next(new ApiError(401, "Invalid access token"));
            }

            // console.log("Access token valid, user:", user);
            req.user = user;
            return next();
        } catch (error) {
            // console.log("Error verifying access token:", error);
            if (error.name === "TokenExpiredError" && refreshToken) {
                // console.log("Access token expired, trying refresh token:", refreshToken);
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

                    // console.log("New tokens generated and set, user:", user);
                    req.user = user;
                    return next();
                } catch (refreshError) {
                    // console.log("Error verifying refresh token:", refreshError);
                    req.user = null;
                    return next();
                }
            } else {
                // console.log("Other error with access token:", error);
                req.user = null;
                return next();
            }
        }
    } else if (refreshToken) {
        // console.log("No access token, trying refresh token:", refreshToken);
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
              
            // console.log("New tokens generated and set, user:", user);
            req.user = user;
            return next();
        } catch (error) {
            // console.log("Error verifying refresh token:", error);
            req.user = null;
            return next();
        }
    } else {
        // console.log("No tokens present, redirecting to login");
        req.user = null;
        return next();
    }
});

export default verifyJWT;
