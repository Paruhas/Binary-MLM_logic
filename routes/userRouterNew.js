const express = require("express");
const userRouterNew = express.Router();
const userControllerNew = require("../controllers/userControllerNew");

userRouterNew.post("/register", userControllerNew.realRegisterUser);

module.exports = userRouterNew;
