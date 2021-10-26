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

const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
dayjs.extend(utc);
dayjs.extend(timezone);

exports.handlerPackageDurationExpire = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const allPackageDuration = await PackageDuration.findAll({
      where: { packageStatus: "ACTIVE" },
    });

    const countArr = [];
    for (let i = 0; i < allPackageDuration.length; i++) {
      let expireDate = dayjs(allPackageDuration[i].dataValues.expireDate).utc();
      let thisDate = dayjs().startOf("date").utc();

      if (expireDate.isBefore(thisDate)) {
        const updatePackageDuration = await PackageDuration.update(
          {
            packageStatus: "INACTIVE",
          },
          {
            where: { userId: allPackageDuration[i].dataValues.userId },
            transaction: transaction,
          }
        );

        if (updatePackageDuration[0] !== 1) {
          throw new CustomError(500, "Internal Server Error");
        }

        countArr.push(updatePackageDuration[0]);
      }
    }

    for (let i = 0; i < countArr.length; i++) {
      if (countArr[i] !== 1) {
        throw new CustomError(500, "Internal Server Error");
      }
    }

    await transaction.commit();

    return res.status(200).json({
      message: "User packageDuration's expireDate process complete",
      updatedUserPackageDuration:
        countArr.length === 0 ? "" : `${countArr.length + 1} user`,
    });
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};
