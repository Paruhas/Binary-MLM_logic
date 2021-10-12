const { sequelize, Package, PackageHistory } = require("../models");
const CustomError = require("../utils/CustomError");

exports.getAllOrderHistoryByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const allOrderHistoryData = await PackageHistory.findAll({
      where: { userId: userId },
    });

    res.status(200).json({ allOrderHistoryData });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { packageId } = req.params;
    const { userId } = req.body;

    if (!userId || !userId.trim()) {
      throw new CustomError(400, "you are Unauthorized (or user id not found)");
    }

    const findPackageById = await Package.findOne({
      where: { id: packageId },
    });

    if (!findPackageById) {
      throw new CustomError(400, "package not found");
    }

    const createOrder = await PackageHistory.create(
      {
        packageId: findPackageById.id,
        packageName: findPackageById.name,
        packageDescription: findPackageById.description,
        packagePrice: findPackageById.price,
        packageDuration: findPackageById.duration,
        userId: userId,
      },
      { transaction: transaction }
    );

    await transaction.commit();

    res
      .status(200)
      .json({ message: "create new order successful", createOrder });
  } catch (error) {
    await transaction.rollback();

    console.log(error);
    next(error);
  }
};
