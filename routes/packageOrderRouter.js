const express = require("express");
const packageOrderRouter = express.Router();
const PackageOrderController = require("../controllers/PackageOrderController");

packageOrderRouter.get("/", PackageOrderController.getAllPackageOrderHistory);
packageOrderRouter.get(
  "/:refKey",
  PackageOrderController.getAllPackageOrderByUserRefKey
);
packageOrderRouter.get(
  "/:refKey/:packageOrderId",
  PackageOrderController.getSinglePackageOrderByIdByUserRefKey
);
packageOrderRouter.post(
  "/:packageId",
  PackageOrderController.createPackageOrder
);

module.exports = packageOrderRouter;
