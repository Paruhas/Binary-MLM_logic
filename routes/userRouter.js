const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/:userId", userController.getUserById);
userRouter.post("/register", userController.register);
userRouter.post("/:userId/place", userController.placeUser);

module.exports = userRouter;
