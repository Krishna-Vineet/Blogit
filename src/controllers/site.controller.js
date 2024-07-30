import User from "../models/user.model";
import Blog from "../models/blog.model";
import Comment from "../models/comment.model";
import Like from "../models/like.model";
import Dislike from "../models/dislike.model";
import Follow from "../models/follow.model";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";


const getHomePage = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(400, "User not found"));
    }
    const user = await User.findById(req.user._id).select("-password -refreshToken");
    try {
        // Fetch latest blogs
        const blogs = await Blog.find({}).sort({ createdAt: -1 }).limit(10);

        // Fetch upcoming events
        const events = await Event.find({}).sort({ date: 1 }).limit(10);

        // Fetch popular blogs
        const popularBlogs = await Blog.find({}).sort({ likes: -1 }).limit(10);

        // Fetch statistics
        const totalUsers = await User.countDocuments();
        const totalBlogs = await Blog.countDocuments();
        const topAuthor = await User.findOne().sort({ blogCount: -1 });
        const mostLikedBlog = await Blog.findOne().sort({ likes: -1 });

        // Fetch trending blogs
        const trendingBlogs = await Blog.find({}).sort({ views: -1 }).limit(10);

        // Fetch blogs from people user follows (assuming req.user contains the logged-in user's info)
        let followedUsersBlogs = [];
        if (req.user) {
            const followedUsers = await User.find({ _id: { $in: req.user.following } });
            followedUsersBlogs = await Blog.find({ author: { $in: followedUsers.map(user => user._id) } }).limit(10);
        }

        // Render the home page with fetched data
        res.render('home', {
            user: req.user,
            blogs,
            events,
            popularBlogs,
            statistics: {
                totalUsers,
                totalBlogs,
                topAuthor: topAuthor ? topAuthor.username : 'N/A',
                mostLikedBlog: mostLikedBlog ? mostLikedBlog.title : 'N/A'
            },
            trendingBlogs,
            followedUsersBlogs
        });
    } catch (error) {
        next(error);
    }
});


export { getHomePage }