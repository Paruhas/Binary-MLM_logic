const express = require("express");
const binaryTreeRouter = express.Router();
const binaryTreeController = require("../controllers/binaryTreeController");

binaryTreeRouter.get("/:refKey", binaryTreeController.getBinaryTriangle);

module.exports = binaryTreeRouter;
