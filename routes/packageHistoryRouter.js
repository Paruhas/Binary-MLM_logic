const express = require("express");
const packageHistoryRouter = express.Router();
const PackageHistoryController = require("../controllers/PackageHistoryController");

packageHistoryRouter.get(
  "/:userId",
  PackageHistoryController.getAllOrderHistoryByUserId
);
packageHistoryRouter.post("/:packageId", PackageHistoryController.createOrder);
packageHistoryRouter.patch("/:id", () => {});

module.exports = packageHistoryRouter;
