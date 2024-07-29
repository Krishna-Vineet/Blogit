import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import verifyJWT from "./middlewares/auth.middleware.js";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())                  // we can access cookies through this middlewarw


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));


import userRoutes from './routes/user.routes.js';
import blogRoutes from './routes/blog.routes.js';
import commentRoutes from './routes/comment.routes.js';
import followRoutes from './routes/follow.routes.js';



// Routes
app.use('/user', userRoutes);
app.use('/blog', blogRoutes);
app.use('/comment', commentRoutes);
app.use('/follow', followRoutes);

export default app;
