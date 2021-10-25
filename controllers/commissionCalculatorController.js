const { Op, QueryTypes, Sequelize } = require("sequelize");
const {
  sequelize,
  User,
  BinaryTree,
  BinaryRank,
  UserBinaryRank,
  CommissionHistory,
  CommissionCalculator,
  PackageDuration,
} = require("../models");
const CustomError = require("../utils/CustomError");

exports.handlerCalculator = async (req, res, next) => {
  try {
    const allUserData = await User.findAll({
      attributes: ["id", "username"],
      include: [
        // {
        //   model: CommissionCalculator,
        //   attributes: ["packageBuyForCalculator"],
        // },
        {
          model: UserBinaryRank,
          attributes: ["totalCommissionPoint", "binaryRankId"],
        },
        {
          model: PackageDuration,
          attributes: ["expireDate", "packageStatus"],
        },
        {
          model: BinaryTree,
          as: "childId",
          attributes: ["position", "parentId", "userId"],
          include: [
            {
              model: User,
              as: "userData",
              attributes: ["id", "username"],
              include: [
                {
                  model: CommissionCalculator,
                  attributes: ["packageBuyForCalculator"],
                },
                {
                  model: PackageDuration,
                  attributes: ["expireDate", "packageStatus"],
                },
                // {
                //   model: UserBinaryRank,
                //   attributes: ["totalCommissionPoint", "binaryRankId"],
                // },
              ],
            },
          ],
        },
      ],
    });

    const binaryRank = await BinaryRank.findAll({
      attributes: ["rankLevel", "maxPayment"],
    });

    const userData_forCalculator = [];
    for (let i = 0; i < allUserData.length; i++) {
      // * Validate Leg must be 2
      if (allUserData[i].childId.length >= 2) {
        // * Validate Leg point must not be 0
        let packageBuyForCalculator_isNotZero = true;

        for (let x = 0; x < allUserData[i].childId.length; x++) {
          if (
            +allUserData[i].childId[x].userData.CommissionCalculator
              .packageBuyForCalculator === 0
          ) {
            packageBuyForCalculator_isNotZero = false;
          }
        }

        if (packageBuyForCalculator_isNotZero) {
          userData_forCalculator.push(allUserData[i]);

          // * Create Output for Easy Management

          /* Refactor Long Code Obj dot notation */
          let user_DataValues = userData_forCalculator[i].dataValues;

          let userData_L = userData_forCalculator[i].childId[0].userData;
          let userData_R = userData_forCalculator[i].childId[1].userData;

          let leg_L_forCal =
            userData_L.CommissionCalculator.packageBuyForCalculator;
          let leg_R_forCal =
            userData_R.CommissionCalculator.packageBuyForCalculator;

          user_DataValues.headUser_packageStatus =
            user_DataValues.PackageDuration.packageStatus;
          user_DataValues.headUser_binaryRank =
            user_DataValues.UserBinaryRank.binaryRankId;
          user_DataValues.headUser_totalCommissionPoint =
            user_DataValues.UserBinaryRank.totalCommissionPoint;

          if (+leg_L_forCal > +leg_R_forCal) {
            user_DataValues.strongLeg_userId = userData_L.id;
            user_DataValues.strongLeg_username = userData_L.username;
            user_DataValues.strongLeg_packageBuyForCalculator = leg_L_forCal;
            user_DataValues.strongLeg_expireDate =
              userData_L.PackageDuration.expireDate;
            user_DataValues.strongLeg_packageStatus =
              userData_L.PackageDuration.packageStatus;

            user_DataValues.weakLeg_userId = userData_R.id;
            user_DataValues.weakLeg_username = userData_R.username;
            user_DataValues.weakLeg_packageBuyForCalculator = leg_R_forCal;
            user_DataValues.weakLeg_expireDate =
              userData_R.PackageDuration.expireDate;
            user_DataValues.weakLeg_packageStatus =
              userData_R.PackageDuration.packageStatus;
          } else if (+leg_L_forCal < +leg_R_forCal) {
            user_DataValues.strongLeg_userId = userData_R.id;
            user_DataValues.strongLeg_username = userData_R.username;
            user_DataValues.strongLeg_packageBuyForCalculator = leg_R_forCal;
            user_DataValues.strongLeg_expireDate =
              userData_R.PackageDuration.expireDate;
            user_DataValues.strongLeg_packageStatus =
              userData_R.PackageDuration.packageStatus;

            user_DataValues.weakLeg_userId = userData_L.id;
            user_DataValues.weakLeg_username = userData_L.username;
            user_DataValues.weakLeg_packageBuyForCalculator = leg_L_forCal;
            user_DataValues.weakLeg_expireDate =
              userData_L.PackageDuration.expireDate;
            user_DataValues.weakLeg_packageStatus =
              userData_L.PackageDuration.packageStatus;
          } else if (+leg_L_forCal == +leg_R_forCal) {
            user_DataValues.strongLeg_userId = userData_L.id;
            user_DataValues.strongLeg_username = userData_L.username;
            user_DataValues.strongLeg_packageBuyForCalculator = leg_L_forCal;
            user_DataValues.strongLeg_expireDate =
              userData_L.PackageDuration.expireDate;
            user_DataValues.strongLeg_packageStatus =
              userData_L.PackageDuration.packageStatus;

            user_DataValues.weakLeg_userId = userData_R.id;
            user_DataValues.weakLeg_username = userData_R.username;
            user_DataValues.weakLeg_packageBuyForCalculator = leg_R_forCal;
            user_DataValues.weakLeg_expireDate =
              userData_R.PackageDuration.expireDate;
            user_DataValues.weakLeg_packageStatus =
              userData_R.PackageDuration.packageStatus;
          }

          user_DataValues.insert_commissionPoint =
            +user_DataValues.weakLeg_packageBuyForCalculator;
          user_DataValues.insert_commissionPay =
            user_DataValues.insert_commissionPoint * 0.1;
          user_DataValues.insert_newStrongLeg_packageBuyForCalculator =
            +user_DataValues.strongLeg_packageBuyForCalculator -
            +user_DataValues.weakLeg_packageBuyForCalculator;
          user_DataValues.insert_newWeakLeg_packageBuyForCalculator =
            +user_DataValues.weakLeg_packageBuyForCalculator -
            +user_DataValues.weakLeg_packageBuyForCalculator;
          ////////////////////////////////////////////////////////
          /* FOR CLEANING OUTPUT === Remove full associate childId (leg User) */
          ////////////////////////////////////////////////////////
          delete userData_forCalculator[i].dataValues.UserBinaryRank;
          delete userData_forCalculator[i].dataValues.PackageDuration;
          delete userData_forCalculator[i].dataValues.childId;
        }
      }
    }

    // console.log(userData_forCalculator, "userData_forCalculator");

    // *Flow commission pay and insert to DB
    for (let i = 0; i < userData_forCalculator.length; i++) {
      console.log(userData_forCalculator[i].dataValues, { runtime: i + 1 });

      let userData_CV = userData_forCalculator[i].dataValues;

      let insert_commissionRealPay = null;

      for (let x = 0; x < binaryRank.length; x++) {
        if (+binaryRank[x].rankLevel === userData_CV.headUser_binaryRank) {
          userData_CV.insert_commissionPay > binaryRank[x].maxPayment
            ? (insert_commissionRealPay = binaryRank[x].maxPayment)
            : (insert_commissionRealPay = userData_CV.insert_commissionPay);
        }
      }

      console.log({
        create_CommissionHistory: {
          commission_before_pay: userData_CV.insert_commissionPay,
          commission_pay: insert_commissionRealPay,
          pay_status:
            userData_CV.weakLeg_packageStatus === "ACTIVE"
              ? "PAID"
              : "NOT_PAID",
          user_id: userData_CV.id,
        },
        update_CommissionCalculator: {
          package_buy_for_calculator: [
            userData_CV.insert_newStrongLeg_packageBuyForCalculator,
            userData_CV.insert_newWeakLeg_packageBuyForCalculator,
          ],
          where: [userData_CV.strongLeg_userId, userData_CV.weakLeg_userId],
        },
        update_UserBinaryRank: {
          total_commission_point:
            +userData_CV.headUser_totalCommissionPoint +
            userData_CV.insert_commissionPoint,
          where: {
            user_id: userData_CV.id,
          },
        },
      });
    }

    return res.status(200).json({
      message: "handlerCalculator PATH",
      // allUserData,
      userData_forCalculator,
      binaryRank,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
