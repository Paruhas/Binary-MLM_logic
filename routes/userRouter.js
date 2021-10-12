const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/:userId", userController.getUserById);
userRouter.post("/register", userController.register);

/**
 * OLD CODE
 */
// userRouter.get("/", userController.getUserPage);
// userRouter.get("/:userId", userController.getUserInfo);
// userRouter.post("/register", userController.register);
// userRouter.patch("/:id/place", userController.placeDownLine);

module.exports = userRouter;
