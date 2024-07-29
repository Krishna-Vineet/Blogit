import mongoose, { Schema } from "mongoose";

// Schema for dislikes on blogs and comments
const dislikeSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        entityType: {
            type: String,
            enum: ["Blog", "Comment"],
            required: true
        },
        entityId: {
            type: Schema.Types.ObjectId,
            required: true
        }
    },
    {
        timestamps: true,
        unique: true // Ensures a user can dislike an entity only once
    }
);

const Dislike = mongoose.model("Dislike", dislikeSchema);

export default Dislike;
