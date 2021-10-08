const express = require("express");
const userRouter = express.Router();
const userController = require("../controllers/userController");

userRouter.get("/", userController.getUserPage);

userRouter.get("/info/:userId", userController.getUserInfo);

userRouter.post("/register", userController.register);

userRouter.patch("/:id/place", userController.placeDownLine);

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

module.exports = userRouter;
