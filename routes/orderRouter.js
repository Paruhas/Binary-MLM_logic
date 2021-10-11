const express = require("express");
const orderRouter = express.Router();
const orderController = require("../controllers/orderController");

orderRouter.get("/:userId", orderController.getAllOrderHistoryByUserId);
orderRouter.post("/:packageId", orderController.createOrder);
orderRouter.patch("/:id", () => {});

module.exports = orderRouter;
