import express from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    updateUserAvatar,
    updateUserDetails,
    deleteUserAccount,
    getUserDetails,
    sendOtp,
    resetPassword,
    changeEmail
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();


router.post('/sendOtp', sendOtp);
router.post('/resetPassword', resetPassword);
router.post('/resetEmail', verifyJWT, changeEmail);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);
router.patch('/update', verifyJWT, updateUserDetails);
router.patch('/update-avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
router.delete('/delete-account', verifyJWT, deleteUserAccount);
router.get('/profile/:userId', verifyJWT, getUserDetails);  


export default router;
