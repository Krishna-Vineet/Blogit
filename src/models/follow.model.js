import mongoose, { Schema } from "mongoose";

const followSchema = new Schema(
    {
        isFollowed: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        hasFollow: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const Follow = mongoose.model("Follow", followSchema);

export default Follow;
