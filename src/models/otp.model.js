import mongoose, { Schema } from "mongoose";

const otpSchema = new Schema(
    {
        otp : {
            type : String,
            required : true
        },
        email : {
            type : String
        },
        username : {
            type : String
        },
        expirationTime : {
            type : Date,
            required : true
        },
        createdAt : {
            type : Date,
            default : Date.now,
            expires : 600  // Auto delete after 10 minutes
        }
    },
    {
        timestamps: true,
    }
);

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;
