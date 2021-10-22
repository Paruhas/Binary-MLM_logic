const express = require("express");
const commissionCalculatorRouter = express.Router();
const commissionCalculatorController = require("../controllers/commissionCalculatorController");

commissionCalculatorRouter.get(
  "/",
  commissionCalculatorController.handlerCalculator
);

module.exports = commissionCalculatorRouter;
