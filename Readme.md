# Blogit: Blog Management System

## Overview

This project is a comprehensive blog management system with user authentication, blog creation and management, interactions, category management, search and filtering, file management, analytics, and event promotions. It is built using Node.js, Express, MongoDB, and Cloudinary.

## Features we are expecting

### 1. User Authentication and Management
- **Registration**: Users can register with email, username, and password.
- **Login**: Users can log in with email and password.
- **Logout**: Users can log out of their account.
- **Profile Management**:
  - View profile details (username, email, avatar, etc.).
  - Update profile details (username, email, password, and avatar).
  - Delete account.

### 2. Blog Management
- **Create Blog**:
  - Add title, content, categories, and an image.
  - Save the blog to the database.
- **Read Blogs**:
  - View all blogs on the homepage.
  - View individual blog posts.
  - View blogs by category.
  - View blogs by user.
- **Update Blog**:
  - Edit the title, content, categories, and image of a blog.
- **Delete Blog**:
  - Delete a blog post.

### 3. Blog Interaction
- **Comments**:
  - Add comments to blogs.
  - Edit comments.
  - Delete comments.
- **Likes/Dislikes**:
  - Like or dislike a blog post.
  - Display the count of likes and dislikes.
- **Follow Users**:
  - Follow/unfollow other users.

### 4. Category Management
- **View Categories**:
  - Display a list of all categories.
- **Add Category** (Admin functionality):
  - Add a new category.
- **Delete Category** (Admin functionality):
  - Delete an existing category.

### 5. Search and Filter
- **Search Blogs**:
  - Search for blogs by keywords in the title or content.
- **Filter Blogs**:
  - Filter blogs by categories.
  - Filter blogs by date (latest/trending).

### 6. File Management
- **Image Upload**:
  - Upload blog images using Cloudinary.
  - Upload user avatars using Cloudinary.

### 7. Analytics and Statistics
- **View Blog Statistics**:
  - Display statistics such as total views, likes, dislikes, and comments.

### 8. Events and Promotions
- **Upcoming Events/Webinars**:
  - Display a section for upcoming events or webinars.
  - Redirect to external event websites.

## Detailed Task for Krishna

### 0. Create Mongoose Models:
- User Model: Done on 22 Jul, 2024
- Blog Model: Done on 22 Jul, 2024
- Comment Model: Done on 22 Jul, 2024
- Follow Model
- Like Model 

### 1. User Authentication and Management
- **Routes**:
  - `POST /register`: Register a new user.
  - `POST /login`: Log in a user.
  - `POST /logout`: Log out a user.
  - `GET /profile`: Get user profile details.
  - `PUT /profile`: Update user profile details.
  - `DELETE /profile`: Delete user account.
- **Controllers**:
  - `registerUser`, `loginUser`, `logoutUser`, `getProfile`, `updateProfile`, `deleteProfile`
- **Middleware**:
  - `authenticateUser`, `authorizeUser`

### 2. Blog Management
- **Routes**:
  - `GET /blogs`: Get all blogs.
  - `GET /blogs/:id`: Get a single blog by ID.
  - `POST /blogs`: Create a new blog.
  - `PUT /blogs/:id`: Update a blog by ID.
  - `DELETE /blogs/:id`: Delete a blog by ID.
- **Controllers**:
  - `getAllBlogs`, `getBlogById`, `createBlog`, `updateBlog`, `deleteBlog`
- **Middleware**:
  - `authenticateUser`, `authorizeUser`

### 3. Blog Interaction
- **Routes**:
  - `POST /blogs/:id/comments`: Add a comment to a blog.
  - `PUT /blogs/:id/comments/:commentId`: Edit a comment.
  - `DELETE /blogs/:id/comments/:commentId`: Delete a comment.
  - `POST /blogs/:id/like`: Like a blog.
  - `POST /blogs/:id/dislike`: Dislike a blog.
  - `POST /users/:id/follow`: Follow a user.
  - `POST /users/:id/unfollow`: Unfollow a user.
- **Controllers**:
  - `addComment`, `editComment`, `deleteComment`, `likeBlog`, `dislikeBlog`, `followUser`, `unfollowUser`
- **Middleware**:
  - `authenticateUser`

### 4. Category Management
- **Routes**:
  - `GET /categories`: Get all categories.
  - `POST /categories`: Add a new category (Admin).
  - `DELETE /categories/:id`: Delete a category (Admin).
- **Controllers**:
  - `getAllCategories`, `addCategory`, `deleteCategory`
- **Middleware**:
  - `authenticateUser`, `authorizeAdmin`

### 5. Search and Filter
- **Routes**:
  - `GET /blogs/search`: Search for blogs.
  - `GET /blogs/category/:category`: Filter blogs by category.
  - `GET /blogs/date/:date`: Filter blogs by date.
- **Controllers**:
  - `searchBlogs`, `filterBlogsByCategory`, `filterBlogsByDate`

### 6. File Management
- **Routes**:
  - `POST /upload/blog-image`: Upload a blog image.
  - `POST /upload/avatar`: Upload a user avatar.
- **Controllers**:
  - `uploadBlogImage`, `uploadAvatar`
- **Middleware**:
  - `authenticateUser`, `uploadImage`

### 7. Analytics and Statistics
- **Routes**:
  - `GET /blogs/:id/statistics`: Get statistics for a blog.
- **Controllers**:
  - `getBlogStatistics`

### 8. Events and Promotions
- **Routes**:
  - `GET /events`: Get all upcoming events.
- **Controllers**:
  - `getAllEvents`

### Next Steps
1. **Set up Controllers**: Implement the logic for each route in the controllers.
2. **Create Routes**: Define routes in the Express application.
3. **Integrate Middleware**: Use middleware for authentication, authorization, and file uploads.
4. **Connect to MongoDB**: Ensure the database is set up and connected.

## Detailed Task for Sunaina
- Add your taks by yourself, write (done) in front of task after completing them

## At last, we both will test every thing.
## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/your-repository.git
   cd your-repository



## Project Timeline
- *15 Jul, 2024:* Got a task by Bharat Intern to make basic blogging page for them.
- *17 Jul, 2024:* Decided to make an loaded full fledged blog webapp **BLOGIT** as a personal project, rejected Bharat Intern
- *19 Jul, 2024:* Basic frontend design complete.
- *20 Jul, 2024:* Team member added _Sunaina_
- *21 Jul, 2024:* Backend work start
- *22 Jul, 2024:* _Sunaina_ Kicked out from project
