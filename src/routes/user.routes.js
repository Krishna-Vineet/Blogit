import express from "express";

import {
    registerUser,
    loginUser,
    logoutUser,
    requestPasswordReset,
    resetPassword,
    updateUserAvatar,
    updateUserDetails,
    deleteUserAccount,
    getUserDetails
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import verifyJWT from "../middlewares/auth.middleware.js";

const router = express.Router();



router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', verifyJWT, logoutUser);
router.patch('/update', verifyJWT, updateUserDetails);
router.patch('/update-avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
router.delete('/delete-account', verifyJWT, deleteUserAccount);
router.get('/profile/:userId', verifyJWT, getUserDetails);  



// Request password reset (send verification code)
router.get('/request-password-reset', verifyJWT, requestPasswordReset);

// Reset password (verify code and set new password)
router.post('/reset-password', resetPassword);

export default router;
