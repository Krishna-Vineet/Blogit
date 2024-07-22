import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())                  // we can access cookies through this middlewarw





// routes import
import userRouter from './routes/user.routes.js';
// import blogRouter from './routes/blog.routes.js';
// import followRouter from './routes/follow.routes.js';
// import commentRouter from "./routes/comment.routes.js";
// import likeRouter from "./routes/like.routes.js";


// routes declaration
app.use("/users", userRouter);
// app.use("/comments", commentRouter);
// app.use("/likes", likeRouter);
// app.use("/blogs", blogRouter);
// app.use("/follows", followRouter);


// exporting app
export default app 