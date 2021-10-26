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

exports.realRegisterUser = async (req, res, next) => {
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

      if ("create Binary tree Section") {
        if (
          parentIdPosition &&
          parentIdPosition !== validate_RefCodeOwner.userRefKey
        ) {
          const validate_parentIdPosition_userData = await User.findOne({
            where: { userRefKey: parentIdPosition },
          });
          if (!validate_parentIdPosition_userData) {
            throw new CustomError(
              400,
              "UserData for parentIdPosition not found"
            );
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

              if (!allChild_BinaryTree.includes(child.userId)) {
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

          await getLast_spillover_userData_BinaryTree(
            validate_parentIdPosition_userData.id
          );

          const createBinaryTree = await BinaryTree.create(
            {
              parentId:
                last_spillover_userData.length === 0
                  ? validate_parentIdPosition_userData
                  : last_spillover_userData[0].userId,
              position: refCode_position,
              placeByUserId: validate_RefCodeOwner.id,
              userId: createNewUser.id,
            },
            { transaction: transaction }
          );

          await transaction.rollback();
          // await transaction.commit();

          return res.status(201).json({
            message: "Insert newUser detail in database successful",
            case: "parentIdPosition && +parentIdPosition !== getRefCodeUserData.id",
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
          throw new CustomError(999, "เข้าแล้วว้อย");
          /**
           * Validate NewUser(placeUser) and refCodeUser are same Binary Line
           *  - getAllParents FN -> get `allParents (id)` data
           *  - use `allParents (id)` find one `KodGrandParent`
           *    (Head of Binary tree of this userId) from DB { ref_from === null }
           * + [2 CASE]
           *    + CASE 1: [allParents.length !== 0]
           *      - use `KodGrandParent` ID find All Child (All member in Binary tree)
           *    + CASE 2: [allParents.length === 0]
           *      - `RefCodeUserData` is Parent himself
           *      - use `RefCodeUserData` ID find All Child (All member in Binary tree)
           * * => Validate that ParentUser & NewUser(placeUser) in the same binaryTree
           */

          // ----- Get all parents (UserId that send invite to this User AND top User that send invited to send invite User (and more) ) -----
          const allParents = [];

          async function getAllParents(params) {
            const Fn_arr = [];

            const resultFromDB = await InvitedHistory.findAll({
              where: { user_invited: params },
            });

            if (resultFromDB.length == 0) {
              allParents.sort((a, b) => a - b);
              return;
            }

            for (let i = 0; i < resultFromDB.length; i++) {
              let child = resultFromDB[i];

              if (!allParents.includes(child.userInviteSend)) {
                await allParents.push(child.userInviteSend);
              }

              await Fn_arr.push(child.userInviteSend);

              await getAllParents(Fn_arr);
            }
          }

          await getAllParents([validate_RefCodeOwner.id]);

          console.log(allParents, { allParents: "allParents" });

          // RefCodeUser is not KodGrandParent himself (allParents.length !== 0)
          if (allParents.length !== 0) {
            let findKodGrandParent = null;
            if (allParents.length !== 0) {
              findKodGrandParent = await User.findAll({
                where: { [Op.and]: [{ id: allParents }, { ref_from: null }] },
              });
            }
            if (findKodGrandParent?.length !== 1) {
              throw new CustomError(
                500,
                "Internal server error; found more than one KodGrandParent"
              );
            }

            // ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) -----
            const allKodGrandParent_child = [];

            async function getAllKodGrandParent_child(params) {
              const Fn_arr = [];

              const resultFromDB = await InvitedHistory.findAll({
                where: { user_invite_send: params },
              });

              if (resultFromDB.length == 0) {
                allKodGrandParent_child.sort((a, b) => a - b);
                return;
              }

              for (let i = 0; i < resultFromDB.length; i++) {
                let child = resultFromDB[i];

                if (!allKodGrandParent_child.includes(child.userInvited)) {
                  await allKodGrandParent_child.push(child.userInvited);

                  await Fn_arr.push(child.userInvited);

                  await getAllKodGrandParent_child(Fn_arr);
                }
              }
            }

            await getAllKodGrandParent_child([findKodGrandParent[0].id]);

            let placeIdIsDownLine_KodGrandParent = false;
            Promise.all(
              allKodGrandParent_child.map((item) => {
                if (item === +newUserData.id) {
                  placeIdIsDownLine_KodGrandParent = true;
                }
              })
            );
            if (!placeIdIsDownLine_KodGrandParent) {
              throw new CustomError(
                500,
                "Internal Server Error;Parent and/or New User are not same Binary tree"
              );
            }
          }

          // RefCodeUser is KodGrandParent himself (allParents.length === 0)
          if (allParents.length === 0) {
            // ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) -----
            const allKodGrandParent_child = [];

            async function getAllKodGrandParent_child(params) {
              const Fn_arr = [];

              const resultFromDB = await InvitedHistory.findAll({
                where: { user_invite_send: params },
              });

              if (resultFromDB.length == 0) {
                allKodGrandParent_child.push(createNewUser.id);

                allKodGrandParent_child.sort((a, b) => a - b);
                return;
              }

              for (let i = 0; i < resultFromDB.length; i++) {
                let child = resultFromDB[i];

                if (!allKodGrandParent_child.includes(child.userInvited)) {
                  await allKodGrandParent_child.push(child.userInvited);

                  await Fn_arr.push(child.userInvited);

                  await getAllKodGrandParent_child(Fn_arr);
                }
              }
            }

            await getAllKodGrandParent_child([validate_RefCodeOwner.id]);

            console.log(allKodGrandParent_child, {
              allKodGrandParent_child: "allKodGrandParent_child",
            });

            let placeIdIsDownLine_KodGrandParent = false;
            Promise.all(
              allKodGrandParent_child.map((item) => {
                if (item === +createNewUser.id) {
                  placeIdIsDownLine_KodGrandParent = true;
                }
              })
            );
            if (!placeIdIsDownLine_KodGrandParent) {
              throw new CustomError(
                500,
                "Internal Server Error;Parent and/or New User are not same Binary tree"
              );
            }
          }

          /**
           * CHECK: refCodeUser (InviterUser) is already parent or not
           * - < to define what DATA will insert in DATABASE >
           * - [2 CASE]
           *    - CASE 1: [findInviterUser_alreadyParent === null]
           *      - InviterUser is not a parent in BinaryTree yet
           *      - <place RegisterUser / set parent === InviteUser >
           *    - CASE 2: [findInviterUser_alreadyParent !== null]
           *        - InviterUser is ALREADY PARENT at this position in BinaryTree
           *        - getChild() at this BinaryTree_positionLine -> until get userId === null
           *        - <last TableRow userId === Parent>
           */
          const findInviterUser_alreadyParent = await BinaryTree.findOne({
            where: {
              [Op.and]: [
                { parentId: validate_RefCodeOwner.id },
                { position: refCode_position },
              ],
            },
          });

          // CASE 1: InviterUser is not a parent in BinaryTree yet
          if (!findInviterUser_alreadyParent) {
            const createBinaryTree = await BinaryTree.create(
              {
                parentId: validate_RefCodeOwner.id,
                position: refCode_position,
                placeByUserId: validate_RefCodeOwner.id,
                userId: createNewUser.id,
              },
              { transaction: transaction }
            );

            await transaction.rollback();
            // await transaction.commit();

            return res.status(200).json({
              message: "place user in Binary Tree successful",
              case: "case1: !parentIdPosition || +parentIdPosition === getRefCodeUserData.id [InviterUser is not a parent in BinaryTree yet]",
              createBinaryTree,
            });
          }

          // CASE 2: InviterUser is ALREADY PARENT at this position in BinaryTree
          if (findInviterUser_alreadyParent) {
            // FIND new Parent
            const lastUserData = [];

            async function getLastUser_inBinaryTreeLine(firstUserRefCode) {
              const resultFromDB = await BinaryTree.findOne({
                where: {
                  [Op.and]: [
                    { parent_id: firstUserRefCode },
                    { position: position },
                  ],
                },
              });

              if (!resultFromDB) {
                return;
              }

              if (resultFromDB) {
                lastUserData.length = 0;
                lastUserData.push(resultFromDB.dataValues);
              }

              await getLastUser_inBinaryTreeLine(resultFromDB.userId);
            }

            await getLastUser_inBinaryTreeLine(getRefCodeUserData.id);

            const createBinaryTree = await BinaryTree.create(
              {
                parentId: lastUserData[0].userId,
                position: position,
                placeByUserId: getRefCodeUserData.id,
                userId: newUserData.id,
              },
              { transaction: transaction }
            );

            await transaction.commit();

            return res.status(200).json({
              message: "place user in Binary Tree successful",
              case: "case2: !parentIdPosition || +parentIdPosition === getRefCodeUserData.id [InviterUser is ALREADY PARENT at this position in BinaryTree]",
              createBinaryTree,
            });
          }
        }
      }
    }

    throw new CustomError(999, "this is old code section");

    //////////////////////////////////////////////////////////////
    // OLD CODE //
    //////////////////////////////////////////////////////////////
    const getRefCodeUserData = await User.findOne({
      where: { [Op.or]: [{ refCodeL: refCode }, { refCodeR: refCode }] },
    });
    if (!getRefCodeUserData) {
      throw new CustomError(400, "This ref code not found");
    }
    if (getRefCodeUserData.id === +newUserData.id) {
      throw new CustomError(400, "newUseId and refCodeUserData are same User");
    }

    let position = null;
    if (getRefCodeUserData.refCodeL === refCode) {
      position = "L";
    }
    if (getRefCodeUserData.refCodeR === refCode) {
      position = "R";
    }

    // Validate newUserData is invited by refCode or refCodeDownLine //
    const allChild_invitedHistory = [];

    async function getAllChild_invitedHistory(params) {
      const Fn_arr = [];

      const resultFromDB = await InvitedHistory.findAll({
        where: { user_invite_send: params },
      });

      if (resultFromDB.length == 0) {
        allChild_invitedHistory.sort((a, b) => a - b);
        return;
      }

      for (let i = 0; i < resultFromDB.length; i++) {
        let child = resultFromDB[i];

        if (!allChild_invitedHistory.includes(child.userInvited)) {
          await allChild_invitedHistory.push(child.userInvited);

          await Fn_arr.push(child.userInvited);

          await getAllChild_invitedHistory(Fn_arr);
        }
      }
    }

    await getAllChild_invitedHistory([getRefCodeUserData.id]);

    let newUser_isInvited_byRefCodeUserOrHisDownLine = false;
    Promise.all(
      allChild_invitedHistory.map((item) => {
        if (item === +newUserData.id) {
          newUser_isInvited_byRefCodeUserOrHisDownLine = true;
        }
      })
    );
    if (!newUser_isInvited_byRefCodeUserOrHisDownLine) {
      throw new CustomError(
        400,
        "Cannot manage new user; This user not invited by RefCodeUser or his downLine"
      );
    }
    /////////////////////////////////////////////////////////////////

    if (parentIdPosition && +parentIdPosition !== getRefCodeUserData.id) {
      const validate_parentIdPosition_hasData = await User.findOne({
        where: { id: parentIdPosition },
      });
      if (!validate_parentIdPosition_hasData) {
        throw new CustomError(400, "parentIdPosition user not found");
      }

      const validate_parentIdPosition_isPlaced = await BinaryTree.findOne({
        where: { userId: parentIdPosition },
      });
      if (!validate_parentIdPosition_isPlaced) {
        throw new CustomError(
          400,
          "parentIdPosition not place in BinaryTree yet"
        );
      }

      /**
       * Get All Child of refCodeUser from BinaryTree
       *  => Validate that refCodeUser have permission to select this parentIdPosition
       */
      // ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) -----
      const allChild_BinaryTree = [];

      async function getAllChild_BinaryTree(params) {
        const Fn_arr = [];

        const resultFromDB = await BinaryTree.findAll({
          where: { parent_id: params },
        });

        if (resultFromDB.length == 0) {
          allChild_BinaryTree.sort((a, b) => a - b);
          return;
        }

        for (let i = 0; i < resultFromDB.length; i++) {
          let child = resultFromDB[i];

          if (!allChild_BinaryTree.includes(child.userId)) {
            await allChild_BinaryTree.push(child.userId);

            await Fn_arr.push(child.userId);

            await getAllChild_BinaryTree(Fn_arr);
          }
        }
      }

      await getAllChild_BinaryTree([getRefCodeUserData.id]);

      let parentIdPosition_isDownLine_BinaryTree = false;
      Promise.all(
        allChild_BinaryTree.map((item) => {
          if (item === +parentIdPosition) {
            parentIdPosition_isDownLine_BinaryTree = true;
          }
        })
      );
      if (!parentIdPosition_isDownLine_BinaryTree) {
        throw new CustomError(
          400,
          "You cannot select this position; parentIdPosition not your down line"
        );
      }

      const lastUserData = [];

      async function getLastUser_inBinaryTreeLine(firstUserRefCode) {
        const resultFromDB = await BinaryTree.findOne({
          where: {
            [Op.and]: [{ parent_id: firstUserRefCode }, { position: position }],
          },
        });

        if (!resultFromDB) {
          return;
        }

        if (resultFromDB) {
          lastUserData.length = 0;
          lastUserData.push(resultFromDB.dataValues);
        }

        await getLastUser_inBinaryTreeLine(resultFromDB.userId);
      }

      await getLastUser_inBinaryTreeLine(parentIdPosition);

      const createBinaryTree = await BinaryTree.create(
        {
          parentId:
            lastUserData.length === 0
              ? parentIdPosition
              : lastUserData[0].userId,
          position: position,
          placeByUserId: getRefCodeUserData.id,
          userId: newUserData.id,
        },
        { transaction: transaction }
      );

      await transaction.commit();

      return res.status(200).json({
        message: "place user in Binary Tree successful ",
        case: "parentIdPosition && +parentIdPosition !== getRefCodeUserData.id",
        createBinaryTree,
      });
    }

    if (!parentIdPosition || +parentIdPosition === getRefCodeUserData.id) {
      /**
       * Validate NewUser(placeUser) and refCodeUser are same Binary Line
       *  - getAllParents FN -> get `allParents (id)` data
       *  - use `allParents (id)` find one `KodGrandParent`
       *    (Head of Binary tree of this userId) from DB { ref_from === null }
       * + [2 CASE]
       *    + CASE 1: [allParents.length !== 0]
       *      - use `KodGrandParent` ID find All Child (All member in Binary tree)
       *    + CASE 2: [allParents.length === 0]
       *      - `RefCodeUserData` is Parent himself
       *      - use `RefCodeUserData` ID find All Child (All member in Binary tree)
       * * => Validate that ParentUser & NewUser(placeUser) in the same binaryTree
       */

      // ----- Get all parents (UserId that send invite to this User AND top User that send invited to send invite User (and more) ) -----
      const allParents = [];

      async function getAllParents(params) {
        const Fn_arr = [];

        const resultFromDB = await InvitedHistory.findAll({
          where: { user_invited: params },
        });

        if (resultFromDB.length == 0) {
          allParents.sort((a, b) => a - b);
          return;
        }

        for (let i = 0; i < resultFromDB.length; i++) {
          let child = resultFromDB[i];

          if (!allParents.includes(child.userInviteSend)) {
            await allParents.push(child.userInviteSend);
          }

          await Fn_arr.push(child.userInviteSend);

          await getAllParents(Fn_arr);
        }
      }

      await getAllParents([getRefCodeUserData.id]);

      // RefCodeUser is not KodGrandParent himself (allParents.length !== 0)
      if (allParents.length !== 0) {
        let findKodGrandParent = null;
        if (allParents.length !== 0) {
          findKodGrandParent = await User.findAll({
            where: { [Op.and]: [{ id: allParents }, { ref_from: null }] },
          });
        }
        if (findKodGrandParent?.length !== 1) {
          throw new CustomError(
            500,
            "Internal server error; found more than one KodGrandParent"
          );
        }

        // ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) -----
        const allKodGrandParent_child = [];

        async function getAllKodGrandParent_child(params) {
          const Fn_arr = [];

          const resultFromDB = await InvitedHistory.findAll({
            where: { user_invite_send: params },
          });

          if (resultFromDB.length == 0) {
            allKodGrandParent_child.sort((a, b) => a - b);
            return;
          }

          for (let i = 0; i < resultFromDB.length; i++) {
            let child = resultFromDB[i];

            if (!allKodGrandParent_child.includes(child.userInvited)) {
              await allKodGrandParent_child.push(child.userInvited);

              await Fn_arr.push(child.userInvited);

              await getAllKodGrandParent_child(Fn_arr);
            }
          }
        }

        await getAllKodGrandParent_child([findKodGrandParent[0].id]);

        let placeIdIsDownLine_KodGrandParent = false;
        Promise.all(
          allKodGrandParent_child.map((item) => {
            if (item === +newUserData.id) {
              placeIdIsDownLine_KodGrandParent = true;
            }
          })
        );
        if (!placeIdIsDownLine_KodGrandParent) {
          throw new CustomError(
            500,
            "Internal Server Error;Parent and/or New User are not same Binary tree"
          );
        }
      }

      // RefCodeUser is KodGrandParent himself (allParents.length === 0)
      if (allParents.length === 0) {
        // ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) -----
        const allKodGrandParent_child = [];

        async function getAllKodGrandParent_child(params) {
          const Fn_arr = [];

          const resultFromDB = await InvitedHistory.findAll({
            where: { user_invite_send: params },
          });

          if (resultFromDB.length == 0) {
            allKodGrandParent_child.sort((a, b) => a - b);
            return;
          }

          for (let i = 0; i < resultFromDB.length; i++) {
            let child = resultFromDB[i];

            if (!allKodGrandParent_child.includes(child.userInvited)) {
              await allKodGrandParent_child.push(child.userInvited);

              await Fn_arr.push(child.userInvited);

              await getAllKodGrandParent_child(Fn_arr);
            }
          }
        }

        await getAllKodGrandParent_child([getRefCodeUserData.id]);

        let placeIdIsDownLine_KodGrandParent = false;
        Promise.all(
          allKodGrandParent_child.map((item) => {
            if (item === +newUserData.id) {
              placeIdIsDownLine_KodGrandParent = true;
            }
          })
        );
        if (!placeIdIsDownLine_KodGrandParent) {
          throw new CustomError(
            500,
            "Internal Server Error;Parent and/or New User are not same Binary tree"
          );
        }
      }

      /**
       * CHECK: refCodeUser (InviterUser) is already parent or not
       * - < to define what DATA will insert in DATABASE >
       * - [2 CASE]
       *    - CASE 1: [findInviterUser_alreadyParent === null]
       *      - InviterUser is not a parent in BinaryTree yet
       *      - <place RegisterUser / set parent === InviteUser >
       *    - CASE 2: [findInviterUser_alreadyParent !== null]
       *        - InviterUser is ALREADY PARENT at this position in BinaryTree
       *        - getChild() at this BinaryTree_positionLine -> until get userId === null
       *        - <last TableRow userId === Parent>
       */
      const findInviterUser_alreadyParent = await BinaryTree.findOne({
        where: {
          [Op.and]: [
            { parentId: getRefCodeUserData.id },
            { position: position },
          ],
        },
      });

      // CASE 1: InviterUser is not a parent in BinaryTree yet
      if (!findInviterUser_alreadyParent) {
        const createBinaryTree = await BinaryTree.create(
          {
            parentId: getRefCodeUserData.id,
            position: position,
            placeByUserId: getRefCodeUserData.id,
            userId: newUserData.id,
          },
          { transaction: transaction }
        );

        await transaction.commit();

        return res.status(200).json({
          message: "place user in Binary Tree successful",
          case: "case1: !parentIdPosition || +parentIdPosition === getRefCodeUserData.id [InviterUser is not a parent in BinaryTree yet]",
          createBinaryTree,
        });
      }

      // CASE 2: InviterUser is ALREADY PARENT at this position in BinaryTree
      if (findInviterUser_alreadyParent) {
        // FIND new Parent
        const lastUserData = [];

        async function getLastUser_inBinaryTreeLine(firstUserRefCode) {
          const resultFromDB = await BinaryTree.findOne({
            where: {
              [Op.and]: [
                { parent_id: firstUserRefCode },
                { position: position },
              ],
            },
          });

          if (!resultFromDB) {
            return;
          }

          if (resultFromDB) {
            lastUserData.length = 0;
            lastUserData.push(resultFromDB.dataValues);
          }

          await getLastUser_inBinaryTreeLine(resultFromDB.userId);
        }

        await getLastUser_inBinaryTreeLine(getRefCodeUserData.id);

        const createBinaryTree = await BinaryTree.create(
          {
            parentId: lastUserData[0].userId,
            position: position,
            placeByUserId: getRefCodeUserData.id,
            userId: newUserData.id,
          },
          { transaction: transaction }
        );

        await transaction.commit();

        return res.status(200).json({
          message: "place user in Binary Tree successful",
          case: "case2: !parentIdPosition || +parentIdPosition === getRefCodeUserData.id [InviterUser is ALREADY PARENT at this position in BinaryTree]",
          createBinaryTree,
        });
      }
    }

    throw new CustomError(500, "Internal Server Error");
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};
