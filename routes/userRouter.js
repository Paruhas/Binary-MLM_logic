const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/", userController.getUserPage);
userRouter.get("/info/:userId", userController.getUserInfo);
userRouter.post("/register", userController.register);
userRouter.patch("/:id/place", userController.placeDownLine);

module.exports = userRouter;
