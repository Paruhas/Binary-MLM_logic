const express = require("express");

const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/:userId", userController.getUserById);
userRouter.post("/register", userController.register);
userRouter.post("/place", userController.placeUser);

module.exports = userRouter;

const userRouterNew = express.Router();
const userControllerNew = require("../controllers/userControllerNew");

userRouterNew.get("/:id", userControllerNew.realGetUserById);
userRouterNew.post("/register", userControllerNew.realRegisterUser);

module.exports = userRouterNew;
