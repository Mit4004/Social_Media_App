const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        content: {
            type: String,
            default: "",
        },
        media: [
            {
                url: { type: String },
                storageType: { type: String, default: "local" },
                fileType: { type: String, enum: ["image", "video"], default: "image" },
            },
        ],
        likesCount: {
            type: Number,
            default: 0,
        },
        commentsCount: {
            type: Number,
            default: 0,
        },
        visibility: {
            type: String,
            enum: ["public", "friends", "private"],
            default: "public"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);