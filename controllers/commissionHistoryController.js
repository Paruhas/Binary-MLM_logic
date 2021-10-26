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

exports.updateCommissionHistory_payStatus = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const updateCommissionHistory = await CommissionHistory.update(
      {
        payStatus: "PAID",
      },
      { where: { payStatus: "PENDING" }, transaction: transaction }
    );

    if (updateCommissionHistory[0] === 0) {
      throw new CustomError(400, "no update row in CommissionHistory");
    }

    await transaction.commit();

    return res
      .status(200)
      .json({ message: "Update commission payment status successful" });
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};
