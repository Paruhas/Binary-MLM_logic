const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.post("/register", userController.register);
userRouter.get("/:refKey", userController.getUserByRefKey);
userRouter.get(
  "/parent-position/:refCode",
  userController.getParentPositionByRefCode
);

module.exports = userRouter;
