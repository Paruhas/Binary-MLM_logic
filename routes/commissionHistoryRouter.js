const express = require("express");
const commissionHistoryRouter = express.Router();
const commissionHistoryController = require("../controllers/commissionHistoryController");

commissionHistoryRouter.get(
  "/",
  commissionHistoryController.getAllCommissionHistory
);
commissionHistoryRouter.get(
  "/:userId",
  commissionHistoryController.getAllCommissionHistoryUserId
);
commissionHistoryRouter.get(
  "/:userId/:commissionHistoryId",
  commissionHistoryController.getSingleCommissionHistoryByIdByUserId
);
commissionHistoryRouter.put(
  "/",
  commissionHistoryController.updateCommissionHistory_payStatus
);

module.exports = commissionHistoryRouter;
