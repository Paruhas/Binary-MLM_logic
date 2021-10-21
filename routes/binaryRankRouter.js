const express = require("express");
const binaryRankRouter = express.Router();
const binaryRankController = require("../controllers/binaryRankController");

binaryRankRouter.get("/", binaryRankController.getAllBinaryRank);
binaryRankRouter.get("/:rankId", binaryRankController.getSingleBinaryRankById);
binaryRankRouter.post("/", binaryRankController.createBinaryRank);
binaryRankRouter.patch("/:rankId", binaryRankController.updateBinaryRank);

module.exports = binaryRankRouter;
