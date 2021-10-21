const express = require("express");
const binaryTreeRouter = express.Router();
const binaryTreeController = require("../controllers/binaryTreeController");

binaryTreeRouter.get("/:userId", binaryTreeController.getBinaryTriangle);

module.exports = binaryTreeRouter;
