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

    const findUser = await User.findOne({
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

    const findPackageDurationForThisUser = await PackageDuration.findOne({
      where: { userId: userId },
    });
    if (!findPackageDurationForThisUser) {
      throw new CustomError(
        500,
        "Internal Server Error;this user is package duration not found"
      );
    }

    const { packageStatus, expireDate } = findPackageDurationForThisUser;

    /* ----- Calculate New Package Expire Date Function ----- */
    async function getNewExpireDate(date, duration) {
      const Cal_newExpireDate = new Date(
        date.setMonth(date.getMonth() + +duration)
      );
      return await Cal_newExpireDate;
    }

    /**
     * CASE: UserId packageStatus is "INACTIVE"
     * <createPackageOrderHistory & updatePackageDuration(ACTIVE, addExpireDate)>
     */
    if (findPackageDurationForThisUser.packageStatus === "INACTIVE") {
      const newExpireDate = await getNewExpireDate(
        new Date(),
        findPackageById.duration
      );

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

      const updatePackageDuration = await PackageDuration.update(
        {
          expireDate: newExpireDate,
          packageStatus: "ACTIVE",
        },
        { where: { userId: userId } },
        { transaction: transaction }
      );

      if (!updatePackageDuration) {
        throw new CustomError(400, "No data to update; rollback transaction");
      }

      const newUserData = await User.findOne({
        where: { id: userId },
        include: PackageDuration,
      });

      await transaction.commit();

      return res.status(200).json({
        message: "Buy package successful",
        createPackageOrder,
        newUserData,
      });
    }

    /**
     * CASE: UserId packageStatus is "ACTIVE"
     * <createPackageOrderHistory & updatePackageDuration(updateExpireDate)>
     */
    if (findPackageDurationForThisUser.packageStatus === "ACTIVE") {
      const newExpireDate = await getNewExpireDate(
        findPackageDurationForThisUser.expireDate,
        findPackageById.duration
      );

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

      const updatePackageDuration = await PackageDuration.update(
        {
          expireDate: newExpireDate,
        },
        { where: { userId: userId } },
        { transaction: transaction }
      );

      if (!updatePackageDuration) {
        throw new CustomError(400, "No data to update; rollback transaction");
      }

      const newUserData = await User.findOne({
        where: { id: userId },
        include: PackageDuration,
      });

      await transaction.commit();

      return res.status(200).json({
        message: "Buy package successful",
        createPackageOrder,
        newUserData,
      });
    }

    throw new CustomError(500, "Internal Server Error");
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};
