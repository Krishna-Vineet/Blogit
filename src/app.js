import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import verifyJWT from "./middlewares/auth.middleware.js";
import errorHandler from "./middlewares/errorHandler.middleware.js";
import ApiError from "./utils/ApiErrors.js";

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


// app.use((err, req, res, next) => {
//     if (err instanceof ApiError) {
//         res.status(err.statusCode).json({ message: err.message });
//     } else {
//         res.status(500).json({ message: "Internal Server Error" });
//     }
// });


// Redirects
app.get('/', (req, res) => res.redirect('/home'));

app.get('/login', (req, res) => res.render('login'))
app.get('/register', (req, res) => res.render('register'))



import siteRoutes from './routes/site.routes.js';
import userRoutes from './routes/user.routes.js';
import blogRoutes from './routes/blog.routes.js';
import commentRoutes from './routes/comment.routes.js';
import followRoutes from './routes/follow.routes.js';



// Routes
app.use('', siteRoutes);
app.use('/user', userRoutes);
app.use('/blog', blogRoutes);
app.use('/comment', commentRoutes);
app.use('/follow', followRoutes);




// Error handling middleware should be the last middleware
app.use(errorHandler);







export default app;
