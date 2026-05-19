const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/auth.routes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.json({message: "Server is running"})
});

module.exports = app;
