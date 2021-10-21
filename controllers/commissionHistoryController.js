const { Op } = require("sequelize");
const { sequelize, User, CommissionHistory } = require("../models");
const CustomError = require("../utils/CustomError");

exports.getAllCommissionHistory = async (req, res, next) => {
  try {
    const allCommissionHistoryData = await CommissionHistory.findAll({
      include: User,
    });

    res.status(200).json({ allCommissionHistoryData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getAllCommissionHistoryUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const allCommissionHistoryByUserId = await CommissionHistory.findAll({
      where: { userId: userId },
    });

    res.status(200).json({ allCommissionHistoryByUserId });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getSingleCommissionHistoryByIdByUserId = async (req, res, next) => {
  try {
    const { userId, commissionHistoryId } = req.params;

    const singleCommissionHistoryByIdByUserId = await CommissionHistory.findAll(
      {
        where: { [Op.and]: [{ id: commissionHistoryId }, { userId: userId }] },
      }
    );

    if (!singleCommissionHistoryByIdByUserId) {
      throw new CustomError(400, "CommissionHistory not found");
    }

    res.status(200).json({ singleCommissionHistoryByIdByUserId });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
