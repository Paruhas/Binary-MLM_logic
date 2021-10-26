const express = require("express");
const commissionCalculatorRouter = express.Router();
const commissionCalculatorController = require("../controllers/commissionCalculatorController");

commissionCalculatorRouter.post(
  "/",
  commissionCalculatorController.handlerCommissionCalculator
);

module.exports = commissionCalculatorRouter;
