const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/:id", userController.realGetUserById);
userRouter.post("/register", userController.realRegisterUser);

module.exports = userRouter;
