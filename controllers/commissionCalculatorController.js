const { Op, QueryTypes, Sequelize } = require("sequelize");
const {
  sequelize,
  User,
  BinaryTree,
  BinaryRank,
  CommissionHistory,
  CommissionCalculator,
  PackageDuration,
} = require("../models");
const CustomError = require("../utils/CustomError");

exports.handlerCalculator = async (req, res, next) => {
  try {
    const allUserData = await User.findAll({
      include: [
        {
          model: BinaryTree,
          as: "parentId",
        },
      ],
    });

    // const allUserData2 = await sequelize.query(
    //   "SELECT `User`.`id`, `User`.`username`, `User`.`ref_code_l` AS `refCodeL`, `User`.`ref_code_r` AS `refCodeR`, `User`.`ref_from` AS `refFrom`, `User`.`ref_from_user_id` AS `refFromUserId`, `User`.`created_at` AS `createdAt`, `User`.`updated_at` AS `updatedAt`, `BinaryTrees`.`id` AS `BinaryTrees.id`, `BinaryTrees`.`parent_id` AS `BinaryTrees.parentId`, `BinaryTrees`.`position` AS `BinaryTrees.position`, `BinaryTrees`.`place_by_user_id` AS `BinaryTrees.placeByUserId`, `BinaryTrees`.`created_at` AS `BinaryTrees.createdAt`, `BinaryTrees`.`updated_at` AS `BinaryTrees.updatedAt`, `BinaryTrees`.`user_id` AS `BinaryTrees.userId` FROM `users` AS `User` LEFT OUTER JOIN `binary_trees` AS `BinaryTrees` ON `User`.`id` = `BinaryTrees`.`parent_id`;",
    //   { type: QueryTypes.SELECT }
    // );

    const result = await BinaryTree.findAll({
      include: [User],
    });

    res.status(200).json({
      message: "handlerCalculator PATH",
      allUserData,
      // allUserData2,
      result,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
