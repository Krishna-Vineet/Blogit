import express from "express";

import {
   getHomePage,
   getAddBlogPage,
   getHeaderDetails,
   getAllBlogs
   } from "../controllers/site.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();



// router.post('/register', registerUser);
// router.post('/login', loginUser);
router.get('/home', verifyJWT, getHomePage);
router.get('/add-blog', verifyJWT, getAddBlogPage);
router.get('/all-blogs', verifyJWT, getAllBlogs);
router.get('/header-data', verifyJWT, getHeaderDetails);

// router.patch('/update', verifyJWT, updateUserDetails);
// router.patch('/update-avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
// router.patch('/update-password', verifyJWT, changeCurrentPassword);
// router.delete('/delete-account', verifyJWT, deleteUserAccount);
// router.get('/profile/:userId', verifyJWT, getUserDetails);  

export default router;
