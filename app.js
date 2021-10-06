require("dotenv").config();
const cors = require("cors");
const compression = require("compression");
const express = require("express");
const app = express();

const userRouter = require("./routes/userRouter");

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8000;

app.use("/home", (req, res, next) => {
  res.status(200).send("<h1>Welcome Home</h1>");
});

app.use("/user", userRouter);

// Incorrect Path
app.use("/", (req, res, next) => {
  res.status(404).json({ message: "Path not found" });
});

// Handler Error
app.use((err, req, res, next) => {
  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }
  if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError")
    return res.status(401).json({ message: err.message }); // ดัก Error จากการ Auth Token
  if (err.name === "SequelizeValidationError")
    return res.status(400).json({ message: err.message });

  console.log(err);
  res.status(500).json({ message: err.message });
});

// const { sequelize } = require("./models");
// sequelize.sync({ force: true }).then(() => console.log("DB sync"));

app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
