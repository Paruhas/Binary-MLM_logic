const express = require("express");
const packageDurationRouter = express.Router();
const PackageDurationController = require("../controllers/PackageDurationController");

packageDurationRouter.put(
  "/",
  PackageDurationController.handlerPackageDurationExpire
);

module.exports = packageDurationRouter;
