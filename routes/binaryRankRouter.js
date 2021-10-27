const express = require("express");
const binaryRankRouter = express.Router();
const binaryRankController = require("../controllers/binaryRankController");

binaryRankRouter.get("/", binaryRankController.getAllBinaryRank);
binaryRankRouter.get(
  "/:rankLevel",
  binaryRankController.getSingleBinaryRankByRankLevel
);
binaryRankRouter.post("/", binaryRankController.createBinaryRank);
binaryRankRouter.put("/:rankLevel", binaryRankController.updateBinaryRank);

module.exports = binaryRankRouter;
