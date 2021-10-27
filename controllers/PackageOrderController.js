const { Op } = require("sequelize");
const {
  sequelize,
  Package,
  User,
  PackageOrder,
  PackageDuration,
  CommissionCalculator,
  BinaryTree,
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

exports.getAllPackageOrderByUserRefKey = async (req, res, next) => {
  try {
    const { refKey } = req.params;
    const { id } = req.query;

    const isId = id === "true";

    const findById = { id: refKey };
    const findByRefKey = { userRefKey: refKey };

    let searchById = false;
    if (isId) {
      searchById = true;
    }

    const userData = await User.findOne({
      where: searchById ? findById : findByRefKey,
    });
    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    const allPackageOrderByUserId = await PackageOrder.findAll({
      where: { userId: userData.id },
      include: [{ model: User }],
    });

    res.status(200).json({ allPackageOrderByUserId });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getSinglePackageOrderByIdByUserRefKey = async (req, res, next) => {
  try {
    const { refKey, packageOrderId } = req.params;
    const { id } = req.query;

    const isId = id === "true";

    const findById = { id: refKey };
    const findByRefKey = { userRefKey: refKey };

    let searchById = false;
    if (isId) {
      searchById = true;
    }

    const userData = await User.findOne({
      where: searchById ? findById : findByRefKey,
    });
    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    const singlePackageOrderByIdByUserId = await PackageOrder.findAll({
      where: { [Op.and]: [{ id: packageOrderId }, { userId: userData.id }] },
      include: [{ model: User }],
    });

    if (singlePackageOrderByIdByUserId.length === 0) {
      throw new CustomError(400, "PackageOrder for this user not found");
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
    const { refKey } = req.body;
    const { id } = req.query;

    if (!refKey || !refKey.trim()) {
      throw new CustomError(400, "User id is require");
    }

    const isId = id === "true";

    const findById = { id: refKey };
    const findByRefKey = { userRefKey: refKey };

    let searchById = false;
    if (isId) {
      searchById = true;
    }

    const userData = await User.findOne({
      where: searchById ? findById : findByRefKey,
    });
    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    const findPackageById = await Package.findOne({
      where: { id: packageId },
    });
    if (!findPackageById) {
      throw new CustomError(400, "Package not found");
    }

    const findPackageDurationForThisUser = await PackageDuration.findOne({
      where: { userId: userData.id },
    });
    if (!findPackageDurationForThisUser) {
      throw new CustomError(
        500,
        "Internal Server Error;this user is package duration not found"
      );
    }

    // const { packageStatus, expireDate } = findPackageDurationForThisUser;

    /* ----- Function => Calculate New Package Expire Date Function ----- */
    async function getNewExpireDate(date, duration) {
      const Cal_newExpireDate = new Date(
        date.setMonth(date.getMonth() + +duration)
      );
      return Cal_newExpireDate;
    }

    /**
     * Switch Case: Cal ExpireDate (Inactive AND Active User)
     */

    let newExpireDate = null;
    if (findPackageDurationForThisUser.packageStatus === "INACTIVE") {
      newExpireDate = await getNewExpireDate(
        new Date(),
        findPackageById.duration
      );
    }

    if (findPackageDurationForThisUser.packageStatus === "ACTIVE") {
      newExpireDate = await getNewExpireDate(
        findPackageDurationForThisUser.expireDate,
        findPackageById.duration
      );
    }

    if (!newExpireDate) {
      throw new CustomError(500, "Internal Server Error");
    }

    const createPackageOrder = await PackageOrder.create(
      {
        packageId: findPackageById.id,
        packageName: findPackageById.name,
        packageDescription: findPackageById.description,
        packagePrice: findPackageById.price,
        packageDuration: findPackageById.duration,
        userId: userData.id,
      },
      { transaction: transaction }
    );

    const updatePackageDuration = await PackageDuration.update(
      {
        expireDate: newExpireDate,
        packageStatus: "ACTIVE",
      },
      { where: { userId: userData.id }, transaction: transaction }
    );
    if (!updatePackageDuration) {
      throw new CustomError(400, "No data to update; rollback transaction");
    }

    //////////////////////////////////////////////////////////////////////
    // =============== CommissionCalculator Section ======================
    //////////////////////////////////////////////////////////////////////

    const updateCommissionCalculator_thisUser =
      await CommissionCalculator.findOne({
        where: { userId: userData.id },
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

    const allParent_for_thisUser = [];

    async function getAllParent_for_thisUser(param) {
      const findParentUser = await BinaryTree.findOne({
        where: { userId: param },
      });

      if (findParentUser.dataValues.parentId) {
        allParent_for_thisUser.push(findParentUser.dataValues.parentId);

        await getAllParent_for_thisUser(findParentUser.dataValues.parentId);
      }

      if (!findParentUser.dataValues.parentId) {
        return;
      }
    }

    await getAllParent_for_thisUser(userData.id);

    const updateCommissionCalculator_parentUser =
      await CommissionCalculator.findAll({
        where: { userId: allParent_for_thisUser },
      });

    async function sequelize_dotSaveLoop(arrData) {
      for (let i = 0; i < arrData.length; i++) {
        arrData[i].packageBuyForCalculator =
          +arrData[i].packageBuyForCalculator + +findPackageById.price;

        await arrData[i].save({
          transaction: transaction,
        });
      }
    }

    await sequelize_dotSaveLoop(updateCommissionCalculator_parentUser);

    //////////////////////////////////////////////////////////////////////

    const newUserData = await User.findOne({
      where: { id: userData.id },
      include: [{ model: PackageDuration }, { model: CommissionCalculator }],
    });

    await transaction.commit();

    return res.status(201).json({
      message: "Buy package successful",
      createPackageOrder,
      newUserData,
    });
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};
