const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.post("/register", userController.register);
userRouter.get("/:id", userController.getUserById);
userRouter.get(
  "/parent-position/:refCode",
  userController.getParentPositionByRefCode
);

module.exports = userRouter;
