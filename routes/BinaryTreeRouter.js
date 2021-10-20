const express = require("express");
const binaryTreeRouter = express.Router();
const binaryTreeController = require("../controllers/binaryTreeController");

binaryTreeRouter.get("/", (req, res, next) => {
  res.status(999).send("<h1>test binary tree route</h1>");
});

binaryTreeRouter.get("/:userId", binaryTreeController.getBinaryTriangle);

module.exports = binaryTreeRouter;
