const express = require("express");
const packageOrderRouter = express.Router();
const PackageOrderController = require("../controllers/PackageOrderController");

packageOrderRouter.get("/", PackageOrderController.getAllPackageOrderHistory);
packageOrderRouter.get(
  "/:userId",
  PackageOrderController.getAllPackageOrderByUserId
);
packageOrderRouter.get(
  "/:userId/:packageOrderId",
  PackageOrderController.getSinglePackageOrderByIdByUserId
);
packageOrderRouter.post(
  "/:packageId",
  PackageOrderController.createPackageOrder
);

module.exports = packageOrderRouter;
