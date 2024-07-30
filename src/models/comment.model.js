import mongoose, { Schema } from "mongoose";

const commentSchema = new Schema(
    {
        content: {
            type: String,
            required: true,
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        blog: {
            type: Schema.Types.ObjectId,
            ref: "Blog",
            required: true,
        },
        likesCount: {
            type: Number,
            default: 0
        },
       dislikesCount: {
            type: Number,
            default: 0
        }
        ,
    },
    {
        timestamps: true,
    }
);

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;
