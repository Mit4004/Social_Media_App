const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const uploadRoutes = require("./routes/upload.routes");
const friendRoutes = require("./routes/friend.routes");
const postRoutes = require("./routes/post.routes");
const commentRoutes = require("./routes/comment.routes");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: false })); 
app.use(morgan("dev"));

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/upload", uploadRoutes);
app.use("/friends", friendRoutes);
app.use("/posts", postRoutes);
app.use("/comments", commentRoutes);

app.get("/", (req, res) => {
  res.json({message: "Server is running"})
});

module.exports = app;
