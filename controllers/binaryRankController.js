const { Op } = require("sequelize");
const {
  User,
  PackageDuration,
  InvitedHistory,
  BinaryTree,
  BinaryRank,
  sequelize,
} = require("../models");
const CustomError = require("../utils/CustomError");

exports.getAllBinaryRank = async (req, res, next) => {
  try {
    const binaryRanks = await BinaryRank.findAll();

    res.status(200).json({ binaryRanks });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getSingleBinaryRankById = async (req, res, next) => {
  try {
    const { rankId } = req.params;

    const binaryRank = await BinaryRank.findOne({
      where: { id: rankId },
    });

    if (!binaryRank) {
      throw new CustomError(400, "binaryRank not found");
    }

    res.status(200).json({ binaryRank });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.createBinaryRank = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    if (Array.isArray(req.body)) {
      for (let item of req.body) {
        if (!item.rankLevel || !item.rankLevel.trim()) {
          throw new CustomError(400, "rankLevel is require");
        }
        if (!item.maxPayment || !item.maxPayment.trim()) {
          throw new CustomError(400, "maxPayment is require");
        }
        if (!+item.maxPayment > 0) {
          throw new CustomError(400, "maxPayment must be int and not minus");
        }
      }

      const createBinaryRanks = [];
      for (let item of req.body) {
        const bulkCreateBinaryRank = await BinaryRank.create(
          {
            rankLevel: item.rankLevel,
            maxPayment: item.maxPayment,
          },
          {
            transaction: transaction,
          }
        );
        createBinaryRanks.push(bulkCreateBinaryRank);
      }

      await transaction.commit();

      return res.status(201).json({
        message: "Create new BinaryRanks successful",
        createBinaryRanks,
      });
    }

    if (!Array.isArray(req.body)) {
      const { rankLevel, maxPayment } = req.body;

      if (!rankLevel || !rankLevel.trim()) {
        throw new CustomError(400, "rankLevel is require");
      }
      if (!maxPayment || !maxPayment.trim()) {
        throw new CustomError(400, "maxPayment is require");
      }
      if (!+maxPayment > 0) {
        throw new CustomError(400, "maxPayment must be int and not minus");
      }

      const createBinaryRank = await BinaryRank.create(
        {
          rankLevel: rankLevel,
          maxPayment: maxPayment,
        },
        {
          transaction: transaction,
        }
      );

      await transaction.commit();

      return res.status(201).json({
        message: "Create new BinaryRank successful",
        createBinaryRank,
      });
    }

    throw new CustomError(500, "Internal Server Error");
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};

exports.updateBinaryRank = async (req, res, next) => {
  try {
    const { rankId } = req.params;
    let { rankLevel, maxPayment } = req.body;

    if (
      (!rankLevel && !maxPayment) ||
      (!rankLevel.trim() && !maxPayment.trim())
    ) {
      return res.status(400).json({
        message: "All value are empty, nothing to update",
      });
    }

    const oldBinaryRankData = await BinaryRank.findOne({
      where: { id: rankId },
    });

    if (!oldBinaryRankData) {
      return res.status(400).json({ message: "BinaryRank not found" });
    }

    if (!rankLevel || !rankLevel.trim()) {
      rankLevel = oldBinaryRankData.rankLevel;
    }
    if (!maxPayment || !maxPayment.trim()) {
      maxPayment = oldBinaryRankData.maxPayment;
    }
    if (!+maxPayment > 0) {
      throw new CustomError(400, "maxPayment must be int and not minus");
    }

    const updateBinaryRank = await BinaryRank.update(
      {
        rankLevel: rankLevel,
        maxPayment: maxPayment,
      },
      {
        where: { id: rankId },
      }
    );

    if (!updateBinaryRank) {
      return res.status(500).json({ message: "Internal server error" });
    }

    const updatedBinaryRank = await BinaryRank.findOne({
      where: { id: rankId },
    });

    res
      .status(200)
      .json({ message: "Update package successful", updatedBinaryRank });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
