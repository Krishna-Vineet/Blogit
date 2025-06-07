import User from "../models/user.model.js";
import Blog from "../models/blog.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Follow from "../models/follow.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
import asyncHandler from "../utils/asyncHandler.js";
import sendEmail from "../utils/sendEmail.js";

const getHomePage = asyncHandler(async (req, res, next) => {
    let user = null;
    if (req?.user?._id) {
        user = await User.findById(req.user?._id).select("-password -refreshToken");
    }
    
    try {
        // Fetch latest blogs
        const latestBlogs = await Blog.find({}).sort({ createdAt: -1 }).limit(8).populate("author", "_id displayName avatar");

        // Fetch popular blogs
        const popularBlogs = await Blog.find({}).sort({ likesCount: -1 }).limit(8).populate("author", "_id displayName avatar");

        // Fetch statistics
        const totalUsers = await User.countDocuments();
        const totalBlogs = await Blog.countDocuments();
        // Aggregate to count blogs per author
        const topAuthorAggregate = await Blog.aggregate([
            {
              $group: {
                _id: "$author", // Group by author
                blogCount: { $sum: 1 } // Count number of blogs
              }
            },
            {
              $sort: { blogCount: -1 } // Sort by blog count in descending order
            },
            {
              $limit: 1 // Limit to 1 to get the top author
            }
          ]);
          
          // Find the top author details
          const topAuthor = topAuthorAggregate.length > 0 
            ? await User.findById(topAuthorAggregate[0]._id)
            : 'No data'; // If no blogs found, return null or handle accordingly
          
        const mostLikedBlog = await Blog.findOne().sort({ likesCount: -1 });


        const data = {
            user,
            latestBlogs,
            popularBlogs,
            statistics: {
                totalUsers,
                totalBlogs,
                topAuthor: topAuthor ? topAuthor.displayName : 'N/A',
                mostLikedBlog: mostLikedBlog ? mostLikedBlog.title : 'N/A'
            },
        };
        
        res.render('home', data);
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while fetching home page data"));
    }
});


const getHeaderDetails = asyncHandler(async (req, res, next) => {
    let user = null;
    if (req?.user?._id) {
        user = await User.findById(req.user?._id).select("-password -refreshToken");
    }
    try {
        const topAuthors = await User.find({}).select("-password -refreshToken -email").sort({ blogCount: -1 }).limit(3);
        const trendingBlogs = await Blog.find({}).sort({ views: -1 }).limit(10).populate("author", "_id displayName avatar");
    
            // Fetch blogs from people user follows (assuming req.user contains the logged-in user's info)
        let followedUserBlogs = [];
        if (user) {
            const followedUsers = await Follow.find({ hasFollowed: user?._id });
          
            followedUserBlogs = await Blog.find({ author: { $in: followedUsers.map(follow => follow.isFollowed._id) } }).limit(10);
        }
        

        res.status(200).json(new ApiResponse(200, { user, topAuthors, trendingBlogs, followedUserBlogs }, "Header fetched successfully"));
    } catch (error) {
        return next(new ApiError(500, "Something went wrong while fetching header details"));
    }
    
    
})


const getAddBlogPage = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Login to post blog"));
    }
    res.render('add-blog', {user: true});
}) 

const getAllBlogs = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user?._id) ? true : false;
    const blogs = await Blog.aggregate([
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
    const blogsCount = blogs.length;
    
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

    const categoriesWithCount = Object.keys(categoryCount).map(category => {
        return { category, count: categoryCount[category] };
    });

    
    res.render('all-blogs', { blogs, user, categoriesWithCount, blogsCount });
})

const editProfile = asyncHandler(async (req, res, next) => {
    if (!req.user) {
        return next(new ApiError(401, "Login to edit profile"));
    }
    const user = await User.findById(req.user?._id).select("-password -refreshToken");
    
    res.render('edit-profile', user);
})

const searchBlog = asyncHandler(async (req, res, next) => {

  try {
    const user = await User.findById(req.user?._id) ? true : false;
    const { query } = req.query;
  
    if (!query) {
      return next (new ApiError(400, 'Please provide a search query'));
    }
  
    // Build the search criteria
    const searchCriteria = {
      $or: [
        { title: { $regex: query, $options: 'i' } }, // Case-insensitive search in title
        { content: { $regex: query, $options: 'i' } }, // Case-insensitive search in content
        { categories: { $regex: query, $options: 'i' } } // Case-insensitive search in categories
      ]
    };
  
    // Find blogs matching the search criteria
    const blogs = await Blog.aggregate([
      {
        $match: searchCriteria
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
  const blogsCount = blogs.length;
  
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
  
  const categoriesWithCount = Object.keys(categoryCount).map(category => {
      return { category, count: categoryCount[category] };
  });;
      res.render('all-blogs', { blogs, user, categoriesWithCount, blogsCount });
  
  } catch (error) {
    return next (new ApiError(400, error.message || 'Error while searching blog', [error]));
  }
})

const submitFeedback = asyncHandler(async (req, res, next) => {
    const { feedback } = req.body;
    const user = await User.findById(req.user?._id).select("-password -refreshToken");
    if (!user) {
        return next(new ApiError(401, "Login to submit feedback"));
    }
    if (!feedback.trim()) {
        return next(new ApiError(400, "Please write some feedback"));
    }
    try {
        await sendEmail({
          to: 'itsvineetsahu@gmail.com',
          subject: 'Feedback for Blogit Website',
          html: `
              <div style="max-width: 600px; margin: auto; font-family: Verdana, sans-serif; border: 1px solid #ccc; border-radius: 8px; padding: 20px; background-color: #2c2c2c; color: #ffffff;">
              <h2 style="color: #f5ba1a; text-align: center; margin-bottom: 20px;">📝 New User Feedback Received</h2>

              <div style="margin-bottom: 15px;">
                <strong>Name:</strong> <span style="color: #e7e7e7;">${user.displayName}</span><br/>
                <strong>Email:</strong> <span style="color: #e7e7e7;">${user.email}</span><br/>
                <strong>User ID:</strong> <span style="color: #e7e7e7;">${user._id}</span><br/>
                <strong>Date:</strong> <span style="color: #e7e7e7;">${new Date().toLocaleString()}</span>
              </div>

              <div style="margin-bottom: 20px;">
                <strong>Feedback Message:</strong>
                <div style="margin-top: 8px; background-color: #3a3a3a; padding: 15px; border-radius: 5px; color: #f0f0f0; line-height: 1.6;">${feedback}</div>
              </div>

              <div style="text-align: center; font-size: 0.9em; color: #aaaaaa;">
                — Sent automatically by your website feedback system
              </div>
            </div>

          ` });
        res.status(200).json(new ApiResponse(200, 'Feedback submitted'));
    } catch (error) {
        return next (new ApiError(500, 'Error submitting feedback: ' + error.message));
    }
})

const termsAndConditions = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken") || null;
    res.render('terms-and-conditions', { user });
})

const privacyPolicy = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user?._id).select("-password -refreshToken") || null;
    res.render('privacy-policy', { user });
})

export { getHomePage, getAddBlogPage, getHeaderDetails, getAllBlogs, editProfile, searchBlog, submitFeedback, termsAndConditions, privacyPolicy };
