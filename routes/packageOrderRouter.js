const express = require("express");
const packageOrderRouter = express.Router();
const PackageOrderController = require("../controllers/PackageOrderController");

packageOrderRouter.get("/", PackageOrderController.getAllPackageOrderHistory);
packageOrderRouter.get(
  "/:userId?orderId",
  PackageOrderController.getAllOrderOrderByUserId
);
packageOrderRouter.get(
  "/:userId/:packageId",
  PackageOrderController.getOrderOrderByIdByUserId
);
packageOrderRouter.post(
  "/:packageId",
  PackageOrderController.createPackageOrder
);
// packageOrderRouter.patch("/:id", () => {});

module.exports = packageOrderRouter;
