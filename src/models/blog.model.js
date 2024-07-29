import mongoose, { Schema } from 'mongoose';

const blogSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        content: {
            type: Schema.Types.Mixed, // To store HTML content
            required: true
        },
        categories: [{
            type: String
        }],
        image: {
            type: String
        },
        likes: {
            type: Number,
            default: 0
        },
        dislikes: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true
    }
);

// Pre-save hook to update updatedAt field
blogSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
