require("dotenv").config();
const cors = require("cors");
const compression = require("compression");
const express = require("express");
const app = express();

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 8000;

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
    return res.status(401).json({ msg: err.message }); // ดัก Error จากการ Auth Token
  if (err.name === "SequelizeValidationError")
    return res.status(400).json({ msg: err.message });

  console.log(err);
  return res.status(500).json({ messageError: err.message });
});

app.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
