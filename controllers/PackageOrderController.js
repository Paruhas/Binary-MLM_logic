const { Op } = require("sequelize");
const {
  sequelize,
  Package,
  User,
  PackageOrder,
  PackageDuration,
  CommissionCalculator,
} = require("../models");
const CustomError = require("../utils/CustomError");

exports.getAllPackageOrderHistory = async (req, res, next) => {
  try {
    const allPackageOrderData = await PackageOrder.findAll({
      include: User,
    });

    res.status(200).json({ allPackageOrderData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getAllPackageOrderByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const allPackageOrderByUserId = await PackageOrder.findAll({
      where: { userId: userId },
    });

    res.status(200).json({ allPackageOrderByUserId });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getSinglePackageOrderByIdByUserId = async (req, res, next) => {
  try {
    const { userId, packageOrderId } = req.params;

    const singlePackageOrderByIdByUserId = await PackageOrder.findAll({
      where: { [Op.and]: [{ id: packageOrderId }, { userId: userId }] },
    });

    if (!singlePackageOrderByIdByUserId) {
      throw new CustomError(400, "PackageOrder not found");
    }

    res.status(200).json({ singlePackageOrderByIdByUserId });
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

    /* ----- Function => Calculate New Package Expire Date Function ----- */
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
        { where: { userId: userId }, transaction: transaction }
      );

      if (!updatePackageDuration) {
        throw new CustomError(400, "No data to update; rollback transaction");
      }

      //////////////////////////////////////////////////////////////////////
      // =============== CommissionCalculator Section ======================
      //////////////////////////////////////////////////////////////////////
      const updateCommissionCalculator_thisUser =
        await CommissionCalculator.findOne({
          where: { userId: userId },
        });

      updateCommissionCalculator_thisUser.totalPackageBuy =
        +updateCommissionCalculator_thisUser.totalPackageBuy +
        +findPackageById.price;
      updateCommissionCalculator_thisUser.packageBuyForCalculator =
        +updateCommissionCalculator_thisUser.packageBuyForCalculator +
        +findPackageById.price;

      await updateCommissionCalculator_thisUser.save({
        transaction: transaction,
      });

      throw new CustomError(999, "TEST");

      //////////////////////////////////////////////////////////////////////

      await transaction.commit();

      const newUserData = await User.findOne({
        where: { id: userId },
        include: PackageDuration,
      });

      return res.status(201).json({
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
        { where: { userId: userId }, transaction: transaction }
      );

      if (!updatePackageDuration) {
        throw new CustomError(400, "No data to update; rollback transaction");
      }

      const newUserData = await User.findOne({
        where: { id: userId },
        include: PackageDuration,
      });

      await transaction.commit();

      return res.status(201).json({
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
