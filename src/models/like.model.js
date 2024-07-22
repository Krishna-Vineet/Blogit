import mongoose, { Schema } from "mongoose";

// Schema for likes on blogs and comments
const likeSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        entityType: {
            type: String,
            enum: ["blog", "comment"],
            required: true
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    {
        timestamps: true,
        unique: true // Ensures a user can like an entity only once
    }
);

export const Like = mongoose.model("Like", likeSchema);
