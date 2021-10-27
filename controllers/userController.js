const { Op } = require("sequelize");
const {
  User,
  PackageDuration,
  InvitedHistory,
  BinaryTree,
  UserBinaryRank,
  CommissionCalculator,
  sequelize,
} = require("../models");
const CustomError = require("../utils/CustomError");

const isEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

exports.register = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { newUserData, refCode, parentIdPosition } = req.body;

    // * Validate req.body.newUserData
    if (!newUserData.email || !newUserData.email.trim()) {
      throw new CustomError(400, "Email is require");
    }
    if (!isEmail.test(newUserData.email)) {
      throw new CustomError(400, "Email is invalid format");
    }

    if (!newUserData.userRefKey || !newUserData.userRefKey.trim()) {
      throw new CustomError(400, "UserRefKey is require");
    }

    const validate_newUserData_alreadyInDB = await User.findOne({
      where: {
        [Op.or]: [
          { email: newUserData.email },
          { userRefKey: newUserData.userRefKey },
        ],
      },
    });
    if (validate_newUserData_alreadyInDB) {
      throw new CustomError(
        400,
        "This Email OR UserRefKey is already in database "
      );
    }

    /* ----- New user WITHOUT refCode ----- */
    if (!refCode || !refCode.trim()) {
      const createNewUser = await User.create(
        {
          email: newUserData.email,
          userRefKey: newUserData.userRefKey,
          inputRefKey: null,
          inputFromUserId: null,
        },
        { transaction: transaction }
      );

      const createPackageDuration = await PackageDuration.create(
        {
          userId: createNewUser.id,
          expireDate: null,
          packageStatus: "INACTIVE",
        },
        { transaction: transaction }
      );

      const createBinaryTree = await BinaryTree.create(
        {
          parentId: null,
          position: null,
          userId: createNewUser.id,
          placeByUserId: "ADMIN",
        },
        {
          transaction: transaction,
        }
      );

      const createBinaryRank = await UserBinaryRank.create(
        {
          binaryRankId: 1,
          userId: createNewUser.id,
        },
        { transaction: transaction }
      );

      const createCommissionCalculator = await CommissionCalculator.create(
        {
          userId: createNewUser.id,
          totalPackageBuy: 0,
          packageBuyForCalculator: 0,
        },
        { transaction: transaction }
      );

      await transaction.commit();

      return res.status(201).json({
        message: "Insert newUser detail in database successful",
        createNewUser,
        createPackageDuration,
        createBinaryRank,
        createCommissionCalculator,
        createBinaryTree,
      });
    }

    /* ----- New user WITH refCode ----- */
    if (refCode) {
      // * Validate req.body refCode
      if (typeof refCode !== "string") {
        throw new CustomError(400, "RefCode is invalid type");
      }
      if (refCode.split("_").length !== 2) {
        throw new CustomError(400, "RefCode is invalid format");
      }

      let refCode_key = refCode.split("_")[0];
      let refCode_position = refCode.split("_")[1];

      if (!(refCode_position === "L" || refCode_position === "R")) {
        throw new CustomError(400, "RefCode Position is invalid");
      }
      if (+refCode_key === +newUserData.userRefKey) {
        throw new CustomError(400, "newUseData and refCodeOwner are same User");
      }

      const validate_RefCodeOwner = await User.findOne({
        where: {
          userRefKey: refCode_key,
        },
      });
      if (!validate_RefCodeOwner) {
        throw new CustomError(400, "User for this ref code not found");
      }

      ////////// START CREATE newUserData Section  //////////
      const createNewUser = await User.create(
        {
          email: newUserData.email,
          userRefKey: newUserData.userRefKey,
          inputRefKey: refCode_key,
          inputFromUserId: validate_RefCodeOwner.id,
        },
        { transaction: transaction }
      );

      const createPackageDuration = await PackageDuration.create(
        {
          userId: createNewUser.id,
          expireDate: null,
          packageStatus: "INACTIVE",
        },
        { transaction: transaction }
      );

      const createInvitedHistory = await InvitedHistory.create(
        {
          userInviteSend: validate_RefCodeOwner.id,
          userInvited: createNewUser.id,
        },
        { transaction: transaction }
      );

      const createBinaryRank = await UserBinaryRank.create(
        {
          binaryRankId: 1,
          userId: createNewUser.id,
        },
        { transaction: transaction }
      );

      const createCommissionCalculator = await CommissionCalculator.create(
        {
          userId: createNewUser.id,
          totalPackageBuy: 0,
          packageBuyForCalculator: 0,
        },
        { transaction: transaction }
      );
      ////////// END CREATE newUserData Section  //////////

      ////////// START CREATE BinaryTree Section  //////////
      if (
        parentIdPosition &&
        parentIdPosition !== validate_RefCodeOwner.userRefKey
      ) {
        const validate_parentIdPosition_userData = await User.findOne({
          where: { userRefKey: parentIdPosition },
        });
        if (!validate_parentIdPosition_userData) {
          throw new CustomError(400, "UserData for parentIdPosition not found");
        }

        const validate_parentIdPosition_binaryTreeData =
          await BinaryTree.findOne({
            where: { userId: validate_parentIdPosition_userData.id },
          });
        if (!validate_parentIdPosition_binaryTreeData) {
          throw new CustomError(
            400,
            "parentIdPosition not place in BinaryTree yet"
          );
        }

        /**
         * Get All Child of refCodeOwner from BinaryTree
         *  => Validate that refCodeOwner have permission to select this parentIdPosition
         */
        // ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) -----
        const allChild_refCodeOwner_BinaryTree = [];

        async function getAllChild_refCodeOwner_BinaryTree(params) {
          const Fn_arr = [];

          const resultFromDB = await BinaryTree.findAll({
            where: { parent_id: params },
          });

          if (resultFromDB.length == 0) {
            allChild_refCodeOwner_BinaryTree.sort((a, b) => a - b);
            return;
          }

          for (let i = 0; i < resultFromDB.length; i++) {
            let child = resultFromDB[i];

            if (!allChild_refCodeOwner_BinaryTree.includes(child.userId)) {
              allChild_refCodeOwner_BinaryTree.push(child.userId);

              Fn_arr.push(child.userId);

              await getAllChild_refCodeOwner_BinaryTree(Fn_arr);
            }
          }
        }

        await getAllChild_refCodeOwner_BinaryTree([validate_RefCodeOwner.id]);

        let parentIdPosition_isDownLine_refCodeOwner_BinaryTree = false;
        Promise.all(
          allChild_refCodeOwner_BinaryTree.map((item) => {
            if (+item === +validate_parentIdPosition_userData.id) {
              parentIdPosition_isDownLine_refCodeOwner_BinaryTree = true;
            }
          })
        );
        if (!parentIdPosition_isDownLine_refCodeOwner_BinaryTree) {
          throw new CustomError(
            400,
            "You cannot select this parentIdPosition; This user is not your down line"
          );
        }

        /**
         * Get Last Spillover User from parentIdPosition
         *  => if parentIdPosition no last_spillover_userData length === 0
         */
        const last_spillover_userData = [];

        async function getLast_spillover_userData_BinaryTree(param) {
          const resultFromDB = await BinaryTree.findOne({
            where: {
              [Op.and]: [{ parent_id: param }, { position: refCode_position }],
            },
          });

          if (!resultFromDB) {
            return;
          }

          if (resultFromDB) {
            last_spillover_userData.length = 0;
            last_spillover_userData.push(resultFromDB.dataValues);
          }

          await getLast_spillover_userData_BinaryTree(resultFromDB.userId);
        }

        await getLast_spillover_userData_BinaryTree(
          validate_parentIdPosition_userData.id
        );

        const createBinaryTree = await BinaryTree.create(
          {
            parentId:
              last_spillover_userData.length === 0
                ? validate_parentIdPosition_userData.id
                : last_spillover_userData[0].userId,
            position: refCode_position,
            placeByUserId: validate_RefCodeOwner.id,
            userId: createNewUser.id,
          },
          { transaction: transaction }
        );

        await transaction.commit();

        return res.status(201).json({
          message: "Insert newUser detail in database successful",
          case: " parentIdPosition && parentIdPosition !== validate_RefCodeOwner.userRefKe",
          createNewUser,
          createPackageDuration,
          createInvitedHistory,
          createBinaryRank,
          createCommissionCalculator,
          createBinaryTree,
        });
      }

      if (
        !parentIdPosition ||
        parentIdPosition === validate_RefCodeOwner.userRefKey
      ) {
        /**
         * CHECK: refCodeOwner is already parent or not
         * - < to define what DATA will insert in DATABASE >
         * - [2 CASE]
         *    - CASE 1: [refCodeOwner_alreadyParent === null]
         *      - refCodeOwner is not a parent in BinaryTree yet
         *      - <place RegisterUser / set parent === InviteUser >
         *    - CASE 2: [refCodeOwner_alreadyParent !== null]
         *        - refCodeOwner is ALREADY PARENT at this position in BinaryTree
         *        - getChild() at this BinaryTree_positionLine -> until get userId === null
         *        - <last TableRow userId === Parent>
         */
        const refCodeOwner_alreadyParent = await BinaryTree.findOne({
          where: {
            [Op.and]: [
              { parentId: validate_RefCodeOwner.id },
              { position: refCode_position },
            ],
          },
        });

        // CASE 1: refCodeOwner is not a parent in BinaryTree yet
        if (!refCodeOwner_alreadyParent) {
          const createBinaryTree = await BinaryTree.create(
            {
              parentId: validate_RefCodeOwner.id,
              position: refCode_position,
              placeByUserId: validate_RefCodeOwner.id,
              userId: createNewUser.id,
            },
            { transaction: transaction }
          );

          await transaction.commit();

          return res.status(200).json({
            message: "Insert newUser detail in database successful",
            case1:
              " !parentIdPosition || parentIdPosition === validate_RefCodeOwner.userRefKey",
            createNewUser,
            createPackageDuration,
            createInvitedHistory,
            createBinaryRank,
            createCommissionCalculator,
            createBinaryTree,
          });
        }

        // CASE 2: refCodeOwner is ALREADY PARENT at this position in BinaryTree
        if (refCodeOwner_alreadyParent) {
          // * FIND new Parent => Get Last Spillover User from refCodeOwner
          const last_spillover_userData = [];

          async function getLast_spillover_userData_BinaryTree(param) {
            const resultFromDB = await BinaryTree.findOne({
              where: {
                [Op.and]: [
                  { parent_id: param },
                  { position: refCode_position },
                ],
              },
            });

            if (!resultFromDB) {
              return;
            }

            if (resultFromDB) {
              last_spillover_userData.length = 0;
              last_spillover_userData.push(resultFromDB.dataValues);
            }

            await getLast_spillover_userData_BinaryTree(resultFromDB.userId);
          }

          await getLast_spillover_userData_BinaryTree(validate_RefCodeOwner.id);

          const createBinaryTree = await BinaryTree.create(
            {
              parentId: last_spillover_userData[0].userId,
              position: refCode_position,
              placeByUserId: validate_RefCodeOwner.id,
              userId: createNewUser.id,
            },
            { transaction: transaction }
          );

          await transaction.commit();

          return res.status(200).json({
            message: "Insert newUser detail in database successful",
            case2:
              " !parentIdPosition || parentIdPosition === validate_RefCodeOwner.userRefKey",
            createNewUser,
            createPackageDuration,
            createInvitedHistory,
            createBinaryRank,
            createCommissionCalculator,
            createBinaryTree,
          });
        }
      }
    }
    ////////// END CREATE BinaryTree Section  //////////

    throw new CustomError(500, "Internal Server Error");
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    let { id } = req.params;
    const { refKey } = req.query;

    const findById = { id: id };
    const findByRefKey = { userRefKey: id };

    let searchByRefKey = false;
    if (refKey) {
      searchByRefKey = true;
    }

    const userData = await User.findOne({
      where: searchByRefKey ? findByRefKey : findById,
      include: [
        {
          model: PackageDuration,
        },
        {
          model: UserBinaryRank,
        },
        {
          model: CommissionCalculator,
        },
        {
          model: BinaryTree,
          as: "childId",
        },
      ],
    });

    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    res.status(200).json({ userData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.getParentPositionByRefCode = async (req, res, next) => {
  try {
    const { refCode } = req.params;

    if (!refCode || !refCode.trim()) {
      throw new CustomError(400, "RefCode is undefined");
    }
    if (refCode.split("_").length !== 2) {
      throw new CustomError(400, "RefCode is invalid format");
    }

    let refCode_key = refCode.split("_")[0];
    let refCode_position = refCode.split("_")[1];

    const validate_RefCodeOwner = await User.findOne({
      where: { userRefKey: refCode_key },
    });
    if (!validate_RefCodeOwner) {
      throw new CustomError(400, "User for this ref code not found");
    }

    const allChild_refCodeOwner_BinaryTree_id = [];
    const allChild_refCodeOwner_BinaryTree_userData = [validate_RefCodeOwner];

    async function getAllChild_refCodeOwner_BinaryTree(params) {
      const Fn_arr = [];

      const resultFromDB = await BinaryTree.findAll({
        where: { parent_id: params },
        include: [{ model: User, as: "userData" }],
      });

      if (resultFromDB.length == 0) {
        return;
      }

      for (let i = 0; i < resultFromDB.length; i++) {
        let child = resultFromDB[i];

        if (!allChild_refCodeOwner_BinaryTree_id.includes(child.userId)) {
          allChild_refCodeOwner_BinaryTree_id.push(child.userId);
          allChild_refCodeOwner_BinaryTree_userData.push(child.userData);

          Fn_arr.push(child.userId);

          await getAllChild_refCodeOwner_BinaryTree(Fn_arr);
        }
      }
    }

    await getAllChild_refCodeOwner_BinaryTree([validate_RefCodeOwner.id]);

    return res.status(200).json({
      message: "TEST",
      parentPosition_userData: allChild_refCodeOwner_BinaryTree_userData,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
