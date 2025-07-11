import asyncHandler from "../utils/asyncHandler.js";
import Blog  from "../models/blog.model.js";
import User from "../models/user.model.js";
import Comment from "../models/comment.model.js";
import Like from "../models/like.model.js";
import Dislike from "../models/dislike.model.js";
import Follow from "../models/follow.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiErrors.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

// Create a new blog
const createBlog = asyncHandler(async (req, res, next) => {
    
    const { title, content } = req.body;
    let { categories } = req.body;
    // const imageLocalPath = req.file?.path;
    const imageLocalPath = req.file?.buffer;
    const imageLocanName = req.file?.originalname;
    let image = "";
    const user = await User.findById(req.user?._id);
    if (!user) {
        return next(new ApiError(404, "Login to post blog"));
    }
    if (!title.trim()) {
        return next(new ApiError(400, "Title is required"));
    }
    if (!content.trim()) {
        return next(new ApiError(400, "Content is required"));
    }

    if (categories) {
        categories = JSON.parse(categories);
    } else {
        
        return next(new ApiError(400, "At least one category is required"));
    }

    if (imageLocalPath) {    
        
        image = await uploadOnCloudinary(imageLocalPath, imageLocanName);
        image = image.secure_url;
    } else {
        return next(new ApiError(400, "Image is required"));
    }
    
    const blog = await Blog.create({
        title,
        content,
        author: user._id,
        categories,
        image
    });

    if (!blog) {
        return next(new ApiError(500, "Something went wrong while creating blog"));
    }

    res.status(201).json(new ApiResponse(201, blog, "Blog created successfully"));

});

// Update a blog
const updateBlog = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, content, categories } = req.body;

    
    if (!req.user) {
        return next(new ApiError(401, "Login to update blog"));
    }

    const blog = await Blog.findById(id);

    if (!blog) {
        return next(new ApiError(404, "Blog not found"));
    }

    if (blog.author.toString() !== req.user?._id.toString()) {
        return next(new ApiError(403, "You are not authorized to update this blog"));
    }

    // Only update fields that have been provided and are different from current values
    if (title && title !== blog.title) {
        blog.title = title;
    }

    if (content && content !== blog.content) {
        blog.content = content;
    }

    if (categories && JSON.stringify(categories) !== JSON.stringify(blog.categories)) {
        blog.categories = Array.isArray(categories) ? categories : [categories];
    }

    // Handle image update
    if (req.file) {
        if (blog.image) {
            await deleteFromCloudinary(blog.image);
        }
        const image = await uploadOnCloudinary(req.file?.buffer, req.file?.originalname);
        blog.image = image.secure_url;
    }

    blog.edited = true;
    await blog.save();

    res.status(200).json(new ApiResponse(200, blog, "Blog updated successfully"));
});



// Delete a blog
const deleteBlog = asyncHandler(async (req, res, next) => {
    
    
    
    if (!req.user) {
        return next(new ApiError(401, "Login to delete blog"));
    }
    const blogId = req.params.id;
    const userId = req?.user?._id;
    const blogToBeDeleted = await Blog.findById(blogId).populate("author");
    
    const authorId = blogToBeDeleted.author._id;
    
    if (userId.toString() !== authorId.toString()) {
        return next (new ApiError(400, "Bad Authentication"));    
    }

    if (blogToBeDeleted.image) {
        await deleteFromCloudinary(blogToBeDeleted.image);
    }

    

    // Delete the blog
    const blog = await Blog.findByIdAndDelete(blogId);
    if (!blog) {
        return next (new ApiError(404, "Blog not found"));
    }

    // Delete likes related to the blog
    await Like.deleteMany({ entityType: "Blog", entityId: blogId });

    // Delete dislikes related to the blog
    await Dislike.deleteMany({ entityType: "Blog", entityId: blogId });

    // Delete comments related to the blog
    await Comment.deleteMany({ blog: blogId });
    res.status(200).json(new ApiResponse(200, blog, "Blog deleted successfully"));
});

// Get all blogs
const getAllBlogsOfUser = asyncHandler(async (req, res) => {
    // Get userId from auth middleware or request parameters
    const userId = req.user?._id || req.params.userId;

    // Check if userId is present
    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Fetch all blogs for the user
    const blogs = await Blog.find({ author: userId }).sort({ createdAt: -1 });

    // Check if blogs are found
    if (!blogs) {
        throw new ApiError(404, "No blogs found for this user");
    }

    // Respond with the blogs
    res.status(200).json(new ApiResponse(200, blogs, "Blogs fetched successfully"));
});


// Get a single blog
const getBlogById = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user?._id;
    
    const blog = await Blog.findById(id).populate('author', 'displayName avatar');
    if (!blog) {
        return next (new ApiError(404, "Blog not found"));
    }
    
    const user = await User.findById(userId).select("-password -refreshToken") || null;
    const author = await User.findById(blog.author._id);
    
    const blogCount = await Blog.countDocuments({ author: author._id });

    // Get follower count
    const followerCount = await Follow.countDocuments({ isFollowed: author._id });

    const isFollowed = await Follow.findOne({ hasFollowed: userId, isFollowed: author._id }) ? true : false;
    

    const likesCount = await Like.countDocuments({ entityId: id, entityType: 'Blog' });
    const dislikesCount = await Dislike.countDocuments({ entityId: id, entityType: 'Blog' });

    const likedByUser = await Like.findOne({ user: userId, entityId: id, entityType: 'Blog' }) ? true : false;
    const dislikedByUser = await Dislike.findOne({ user: userId, entityId: id, entityType: 'Blog' }) ? true : false;

    const comments = await Comment.find({ blog: id }).populate('author', 'avatar displayName');
    const commentCount = comments.length;
    
    

    // Find similar blogs by categories and high likes
    const similarBlogs = await Blog.find({
        _id: { $ne: id }, // Exclude the current blog
        categories: { $in: blog.categories } // Match categories
    })
    .sort({ likeCount: -1 }) // Sort by likes
    .limit(3) // Limit to 3 similar blogs
    .populate('author', 'displayName avatar'); // Populate author details

    // Get the blog's ranking in popular (all-time likes)
    const popularBlogs = await Blog.find({}).sort({ likeCount: -1 }).limit(5);
    const popularRank = popularBlogs.findIndex(b => b._id.toString() === blog._id.toString()) + 1;

    // Get the blog's ranking in trending (likes in the last week)
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const trendingBlogs = await Blog.find({
        updatedAt: { $gte: lastWeek }
    })
    .sort({ viewsCount: -1 })
    .limit(5);

    const trendingRank = trendingBlogs.findIndex(b => b._id.toString() === blog._id.toString()) + 1;

    const responseData = {
        user,
        blog: {
            _id: blog._id,
            title: blog.title,
            content: blog.content,
            categories: blog.categories,
            image: blog.image,
            createdAt: blog.createdAt,
            updatedAt: blog.updatedAt,
            edited: blog.edited,
            likesCount,
            dislikesCount,
            likedByUser,
            dislikedByUser,
            viewsCount: blog.viewsCount,
            shareCount: blog.shareCount,
            author: {
                _id: author._id,
                displayName: author.displayName,
                avatar: author.avatar,
                bio: author.bio,
                blogCount: blogCount,
                isSelf: userId && userId.toString() === author._id.toString(),
                isFollowed,
                followerCount // Added follower count
            },
            commentCount, // Added comment count
            similarBlogs, // Added similar blogs
            popularRank: popularRank > 0 && popularRank <= 5 ? popularRank : null, // Added popular rank
            trendingRank: trendingRank > 0 && trendingRank <= 5 ? trendingRank : null // Added trending rank
        }
    };
    res.render('blog-page', responseData);
});

const getBlogsByCategory = asyncHandler(async (req, res, next) => {

    const user = await User.findById(req.user?._id).select("-password -refreshToken") || null;
    const userId = req.user?._id || null;

    const { category } = req.params;
    const blogs = await Blog.aggregate([
        { $match : { categories: category } },
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
    const categoriesWithCount = null;

    res.render('all-blogs', { blogs, user, categoriesWithCount, blogsCount });
    
    
});


// Controller to like or unlike a blog
const likeBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!req.user) {
        return next(new ApiError(401, "Login to like blog"));
    }
    let likedByUser;
    // Find the blog
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Check if the user has already liked the blog
    const existingLike = await Like.findOne({ entityType: 'Blog', entityId: id, user: userId });
    if (existingLike) {
        // Remove the like if it exists
        await Like.findByIdAndDelete(existingLike._id);
        // Update blog's like count
        blog.likesCount -= 1;
        await blog.save();
        likedByUser = false;
    } else {
        // Check if the user has disliked the blog
        const existingDislike = await Dislike.findOne({ entityType: 'Blog', entityId: id, user: userId });
        if (existingDislike) {
            // Remove the dislike if it exists
            await Dislike.findByIdAndDelete(existingDislike._id);
            // Update blog's dislike count
            blog.dislikesCount -= 1;
        }
        // Add the like
        await Like.create({ entityType: 'Blog', entityId: id, user: userId });
        
        // Update blog's like count
        blog.likesCount += 1;
        await blog.save();
        likedByUser = true;
    }
    const updatedBlog = await Blog.findById(id);
    const response = {
        likesCount : updatedBlog.likesCount,
        dislikesCount : updatedBlog.dislikesCount,
        likedByUser
    }
    // Send success response    
    res.status(200).json(new ApiResponse(200, response, "Liked"));
});


// Controller to dislike or remove dislike from a blog
const dislikeBlog = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user?._id;

    if (!req.user) {
        return next(new ApiError(401, "Login to dislike blog"));
    }
    let dislikedByUser;
    // Find the blog
    const blog = await Blog.findById(id);
    if (!blog) {
        throw new ApiError(404, "Blog not found");
    }

    // Check if the user has already disliked the blog
    const existingDislike = await Dislike.findOne({ entityType: 'Blog', entityId: id, user: userId });
    if (existingDislike) {
        // Remove the dislike if it exists
        await Dislike.findByIdAndDelete(existingDislike._id);
        // Update blog's dislike count
        blog.dislikesCount -= 1;
        await blog.save();
        dislikedByUser = false;
    } else {
        // Check if the user has liked the blog
        const existingLike = await Like.findOne({ entityType: 'Blog', entityId: id, user: userId });
        if (existingLike) {
            // Remove the like if it exists
            await Like.findByIdAndDelete(existingLike._id);
            // Update blog's like count
            blog.likesCount -= 1;
        }
        // Add the dislike
        await Dislike.create({ entityType: 'Blog', entityId: id, user: userId });
        // Update blog's dislike count
        blog.dislikesCount += 1;
        await blog.save();
        dislikedByUser = true;
    }

    const updatedBlog = await Blog.findById(id);
    const response = {
        likesCount : updatedBlog.likesCount,
        dislikesCount : updatedBlog.dislikesCount,
        dislikedByUser
    }
    // Send success response
    res.status(200).json(new ApiResponse(200, response, "Disliked"));
});

// Increment view count
const incrementViewCount = asyncHandler(async (req, res, next) => {
        try {
          const blogId = req.params.id;
          const blog = await Blog.findByIdAndUpdate(blogId, { $inc: { viewsCount: 1 } });
          
          res.status(200).json(new ApiResponse(200, 'View count incremented'));
        } catch (error) {
          return next (new ApiError(500, 'Error incrementing view count'));
        }
});
  
  // Increment share count
  const incrementShareCount = asyncHandler(async (req, res, next) => {
    try {
        
        const blogId = req.params.id;
        await Blog.findByIdAndUpdate(blogId, { $inc: { shareCount: 1 } });
        res.status(200).json(new ApiResponse(200, 'Share count incremented'));
      } catch (error) {
        return next (new ApiError(500, 'Error incrementing share count'));
      }
  })





const getEditPage = asyncHandler(async (req, res, next) => {
    const userId = req?.user?._id;
    const { id } = req.params;
    const blog = await Blog.findById(id);
    if (!blog) {
        return next (new ApiError(404, "Blog not found"));
    }
    const user = await User.findById(userId);
    if (!user) {
        return next (new ApiError(404, "Login to edit blog"));
    }
    
    if (blog.author.toString() !== user?._id.toString()) {
        return next (new ApiError(403, "Unauthorized access"));
    }
    res.render('edit-blog', { blog, user });
});

export {
    createBlog,
    updateBlog,
    deleteBlog,
    getBlogById,
    getAllBlogsOfUser,
    getBlogsByCategory,
    likeBlog,
    dislikeBlog,
    incrementViewCount,
    incrementShareCount,
    getEditPage
}