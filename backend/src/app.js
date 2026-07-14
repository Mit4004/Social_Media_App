const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const friendRoutes = require("./routes/friend.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: false })); 
app.use(morgan("dev"));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Mount API routes under /api prefix
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);

// Serve frontend build in production
if (process.env.NODE_ENV === "production") {
  const frontendBuildPath = path.join(__dirname, "../../frontend/dist");
  app.use(express.static(frontendBuildPath));

  app.get("/*splat", (req, res) => {
    res.sendFile(path.resolve(frontendBuildPath, "index.html"));
  });
} else {
  // Server health-check route handler returning basic server status (dev only)
  app.get("/", (req, res) => {
    res.json({ message: "Server is running" });
  });
}

module.exports = app;

