const express = require("express");
const packageRouter = express.Router();
const packageController = require("../controllers/packageController");

packageRouter.get("/", packageController.getAllPackages);
packageRouter.get("/:id", packageController.getPackageById);
packageRouter.post("/", packageController.createPackage);
packageRouter.patch("/:id", packageController.updatePackage);

module.exports = packageRouter;
