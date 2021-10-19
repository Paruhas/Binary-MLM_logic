const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/:userId", userController.getUserById);
userRouter.post("/register", userController.register);
userRouter.post("/place", userController.placeUser);
userRouter.post("/test1", userController.test1, userController.test2);

module.exports = userRouter;
