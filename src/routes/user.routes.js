import express from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    changeCurrentPassword,
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
router.post('/logout', logoutUser);
router.patch('/update', verifyJWT, updateUserDetails);
router.patch('/update-avatar', verifyJWT, upload.single('avatar'), updateUserAvatar);
router.patch('/update-password', verifyJWT, changeCurrentPassword);
router.delete('/delete-account', verifyJWT, deleteUserAccount);
router.get('/profile/:userId', verifyJWT, getUserDetails);

export default router;
