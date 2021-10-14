const { Op } = require("sequelize");
const {
  sequelize,
  Package,
  User,
  PackageOrder,
  PackageDuration,
} = require("../models");
const CustomError = require("../utils/CustomError");

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

exports.getAllOrderOrder = async (req, res, next) => {
  return res.status(999).send("This is get all");
  try {
    const allOrderOrderData = await PackageOrder.findAll({});

    res.status(200).json({ allOrderOrderData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getAllOrderOrderByUserId = async (req, res, next) => {
  return res.status(999).send("This is get all by user id");
  try {
    const { userId } = req.params;

    const allOrderOrderByUserIdData = await PackageOrder.findAll({
      where: { userId: userId },
    });

    res.status(200).json({ allOrderOrderByUserIdData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getOrderOrderByIdByUserId = async (req, res, next) => {
  return res.status(999).send("This is get order id by user id ");
  try {
    const { userId, packageId } = req.params;

    const allOrderOrderByIdByUserIdData = await PackageOrder.findAll({
      where: { [Op.or]: [{ id: packageId }, { userId: userId }] },
    });

    res.status(200).json({ allOrderOrderByIdByUserIdData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.createPackageOrder = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { packageId } = req.params;
    const { userId } = req.body;

    if (!userId || !userId.trim()) {
      throw new CustomError(400, "User id is require");
    }

    const findUser = await User.findAll({
      where: { id: userId },
    });

    if (!findUser) {
      throw new CustomError(400, "You are unauthorized (or user id not found)");
    }

    const findPackageById = await Package.findOne({
      where: { id: packageId },
    });

    if (!findPackageById) {
      throw new CustomError(400, "Package not found");
    }

    const findPackageDuration = await PackageDuration.findOne({
      where: { userId: userId },
    });

    if (!findPackageDuration) {
      throw new CustomError(400, "This user is package duration not found");
    }

    console.log(findPackageDuration);

    console.log(findPackageDuration.expireDate === null);

    console.log(dayjs().utc().format());
    console.log(dayjs(findPackageDuration.createdAt).utc().format());

    return res.status(999).send("This is createPackageOrder");

    const createPackageOrder = await PackageOrder.create(
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

    const updatePackageDuration = await PackageOrder.update(
      {
        expireDate: "expireDate",
        packageStatus: "ACTIVE",
      },
      { where: { userId: userId } },
      { transaction: transaction }
    );

    await transaction.commit();

    res
      .status(200)
      .json({ message: "Create new order successful", createPackageOrder });
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};
