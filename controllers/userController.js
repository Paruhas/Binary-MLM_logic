const { Op } = require("sequelize");
const {
  User,
  PackageDuration,
  InvitedHistory,
  BinaryTree,
  sequelize,
} = require("../models");
const CustomError = require("../utils/CustomError");

const isEmail =
  /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

exports.register = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { username, fromRefCode, email } = req.body;
    let noRefCode = false;

    /* ----- Validate username ----- */
    if (!username || !username.trim()) {
      throw new CustomError(400, "username is require");
    }

    const thisUsernameIsAlreadyInDB = await User.findOne({
      where: { username: username },
    });
    if (thisUsernameIsAlreadyInDB) {
      throw new CustomError(400, "This username is already in database");
    }

    // /* ----- Validate email ----- */
    // if (!email || !email.trim()) {
    //   throw new CustomError(400, "email is require");
    // }
    // if (!isEmail.test(email)) {
    //   throw new CustomError(400, "this email is invalid format");
    // }
    // const thisEmailIsAlreadyInDB = await User.findOne({
    //   where: { email: email },
    // });
    // if (thisEmailIsAlreadyInDB) {
    //   throw new CustomError(400, "This email is already in database");
    // }

    /* ----- Manage reference code ----- */
    if (!fromRefCode || !fromRefCode.trim()) {
      noRefCode = true;
    }

    /* ----- New user WITHOUT ref code ----- */
    if (noRefCode) {
      const createNewUser = await User.create(
        {
          username: username,
          refCodeL: Date.now() + "L",
          refCodeR: Date.now() + "R",
          refFrom: null,
          refFromUserId: null,
        },
        { transaction: transaction }
      );

      const createPackageDuration = await PackageDuration.create(
        {
          userId: createNewUser.id,
          expire_date: null,
          package_status: "INACTIVE",
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

      await transaction.commit();

      return res
        .status(201)
        .json({ createNewUser, createPackageDuration, createBinaryTree });
    }

    /* ----- New user WITH ref code ----- */
    if (!noRefCode) {
      const findOldUserRefCode = await User.findOne({
        where: {
          [Op.or]: [{ refCodeL: fromRefCode }, { refCodeR: fromRefCode }],
        },
      });

      if (!findOldUserRefCode) {
        throw new CustomError(400, "This ref code not found");
      }

      const createNewUser = await User.create(
        {
          username: username,
          refCodeL: Date.now() + "L",
          refCodeR: Date.now() + "R",
          refFrom: fromRefCode,
          refFromUserId: findOldUserRefCode.id,
        },
        { transaction: transaction }
      );

      const createPackageDuration = await PackageDuration.create(
        {
          userId: createNewUser.id,
          expire_date: null,
          package_status: "INACTIVE",
        },
        { transaction: transaction }
      );

      const createInvitedHistories = await InvitedHistory.create(
        {
          userInviteSend: findOldUserRefCode.id,
          userInvited: createNewUser.id,
        },
        { transaction: transaction }
      );

      await transaction.commit();

      return res
        .status(201)
        .json({ createNewUser, createPackageDuration, createInvitedHistories });
    }

    throw new CustomError(500, "Internal server error");
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userData = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "refCodeL",
        "refCodeR",
        "refFrom",
        "refFromUserId",
        "createdAt",
      ],
      include: {
        model: PackageDuration,
        attributes: ["expireDate", "packageStatus", "updatedAt"],
      },
    });

    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    /* ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) ----- */
    const allChild = [];

    async function getAllChild(params) {
      const Fn_arr = [];

      const resultFromDB = await InvitedHistory.findAll({
        where: { user_invite_send: params },
      });

      if (resultFromDB.length == 0) {
        allChild.sort((a, b) => a - b);
        return;
      }

      for (let i = 0; i < resultFromDB.length; i++) {
        let child = resultFromDB[i];

        if (!allChild.includes(child.userInvited)) {
          await allChild.push(child.userInvited);

          await Fn_arr.push(child.userInvited);

          await getAllChild(Fn_arr);
        }
      }
    }

    await getAllChild([userId]);

    /* ----- Get all parents (UserId that send invite to this User AND top User that send invited to send invite User (and more) ) ----- */
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

    await getAllParents([userId]);

    const userInvitedHistoryData = await InvitedHistory.findAll({
      where: { userInviteSend: userId },
    });

    let allDownLineUserData = [];
    if (allChild.length !== 0) {
      allDownLineUserData = await User.findAll({
        where: { id: allChild },
      });
    }

    let allUpLineUserData = [];
    if (allParents.length !== 0) {
      allUpLineUserData = await User.findAll({
        where: { id: allParents },
      });
    }

    res.status(200).json({
      userData,
      userInvitedHistoryData,
      allDownLineUserData,
      allUpLineUserData,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};

exports.placeUser = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userId } = req.params;
    const { parentId, placeId, position } = req.body;

    if (userId === placeId) {
      throw new CustomError(400, "You cannot place yourself");
    }
    if (parentId === placeId) {
      throw new CustomError(400, "Parent and place must not equal");
    }

    const validatePosition = ["L", "R"];
    let validatePosition_count = 0;
    for (let i = 0; i < validatePosition.length; i++) {
      if (validatePosition[i] !== position) {
        validatePosition_count += 1;
      }
    }
    if (validatePosition_count === 2) {
      throw new CustomError(400, "This position value is incorrect");
    }

    const validateUserId_hasData = await User.findByPk(userId);
    if (!validateUserId_hasData) {
      throw new CustomError(400, "This user id not found");
    }

    const validateParentId_hasData = await User.findByPk(parentId);
    if (!validateParentId_hasData) {
      throw new CustomError(400, "This parent id not found");
    }

    const validateParentId_hasPlaced = await BinaryTree.findOne({
      where: { userId: parentId },
    });
    if (!validateParentId_hasPlaced) {
      throw new CustomError(400, "This parent id has not place yet");
    }
    if (
      validateParentId_hasPlaced.parentId === null &&
      validateParentId_hasPlaced.position === null &&
      parentId !== userId
    ) {
      throw new CustomError(
        400,
        "This parent id might not in your Binary Line"
      );
    }

    const validatePlaceId_hasData = await User.findByPk(placeId);
    if (!validatePlaceId_hasData) {
      throw new CustomError(400, "This place id not found");
    }

    const validatePlaceId_hasPlaced = await BinaryTree.findOne({
      where: {
        [Op.and]: [{ userId: placeId }, { position: { [Op.ne]: null } }],
      },
    });
    if (validatePlaceId_hasPlaced) {
      throw new CustomError(400, "This place id has already placed");
    }

    /* ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) ----- */
    /**
     * Get All Child of UserId
     *  => Validate that UserId have permission to place this placeId
     */
    const allChild = [];

    async function getAllChild(params) {
      const Fn_arr = [];

      const resultFromDB = await InvitedHistory.findAll({
        where: { user_invite_send: params },
      });

      if (resultFromDB.length == 0) {
        allChild.sort((a, b) => a - b);
        return;
      }

      for (let i = 0; i < resultFromDB.length; i++) {
        let child = resultFromDB[i];

        if (!allChild.includes(child.userInvited)) {
          await allChild.push(child.userInvited);

          await Fn_arr.push(child.userInvited);

          await getAllChild(Fn_arr);
        }
      }
    }

    await getAllChild([userId]);

    let placeIdIsDownLine = false;
    Promise.all(
      allChild.map((item) => {
        if (item === +placeId) {
          placeIdIsDownLine = true;
        }
      })
    );
    if (!placeIdIsDownLine) {
      throw new CustomError(
        400,
        "You cannot place this user; placeId not invited by UserId or UserId's downLine"
      );
    }

    /* ----- Get all parents (UserId that send invite to this User AND top User that send invited to send invite User (and more) ) ----- */
    /**
     * Get All Parents of UserId
     *  - got result `allParents (id)` from getAllParents FN
     *  - use `allParents (id)` find `KodGrandParent` (Head of Binary tree of this userId) from DB
     *  - then use `KodGrandParent` ID find All Child (All member in Binary tree)
     *    => Validate that ParentId in the same binaryTree
     */
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

    await getAllParents([userId]);

    /* If this UserId is KodGrandParent himself => Kick out of FN */
    if (allParents.length !== 0) {
      let findKodGrandParent = null;
      if (allParents.length !== 0) {
        findKodGrandParent = await User.findAll({
          where: { [Op.and]: [{ id: allParents }, { ref_from: null }] },
        });
      }
      if (findKodGrandParent.length !== 1) {
        throw new CustomError(
          500,
          "Internal server error; found more than one KodGrandParent"
        );
      }

      /* ----- Get all child (UserId that this user has invited AND userInvited has invited (and more) ) ----- */
      const allKodGrandParentChild = [];

      async function getAllKodGrandParentChild(params) {
        const Fn_arr = [];

        const resultFromDB = await InvitedHistory.findAll({
          where: { user_invite_send: params },
        });

        if (resultFromDB.length == 0) {
          allKodGrandParentChild.sort((a, b) => a - b);
          return;
        }

        for (let i = 0; i < resultFromDB.length; i++) {
          let child = resultFromDB[i];

          if (!allKodGrandParentChild.includes(child.userInvited)) {
            await allKodGrandParentChild.push(child.userInvited);

            await Fn_arr.push(child.userInvited);

            await getAllKodGrandParentChild(Fn_arr);
          }
        }
      }

      await getAllKodGrandParentChild([findKodGrandParent[0].id]);

      let placeIdIsDownLine_KodGrandParent = false;
      Promise.all(
        allKodGrandParentChild.map((item) => {
          if (item === +parentId) {
            placeIdIsDownLine_KodGrandParent = true;
          }
        })
      );
      if (!placeIdIsDownLine_KodGrandParent) {
        throw new CustomError(400, "This parent is not in your Binary Tree");
      }
    }

    const validateBinaryTree_thisPositionAlreadyPlace =
      await BinaryTree.findOne({
        where: { [Op.and]: [{ parentId: parentId }, { position: position }] },
      });

    if (validateBinaryTree_thisPositionAlreadyPlace) {
      throw new CustomError(
        400,
        "You cannot place this position; This location has already placed"
      );
    }

    /**
     * CASE: ParentId is same as UserId
     * <can place L and R; PLACE ANYWHERE>
     */
    if (userId === parentId) {
      const validateBinaryTree_parentIsLocation_same = await BinaryTree.findAll(
        {
          where: { parentId: parentId },
        }
      );

      if (validateBinaryTree_parentIsLocation_same.length >= 2) {
        throw new CustomError(400, "This parent's both leg are full");
      }

      if (validateBinaryTree_parentIsLocation_same.length === 1) {
        if (validateBinaryTree_parentIsLocation_same[0].position === position) {
          throw new CustomError(400, "This parent's leg now reserve");
        }
      }

      const createBinaryTree = await BinaryTree.create(
        {
          parentId: parentId,
          position: position,
          placeByUserId: userId,
          userId: placeId,
        },
        { transaction: transaction }
      );

      await transaction.commit();

      return res.status(400).json({ createBinaryTree });
    }

    /**
     * CASE: ParentId !== userId
     * BUT ParentId is parent in DB is userId
     * <can place L and R; PLACE ANYWHERE>
     */
    const validateParentId_1LvGrandParent_isUserId = await BinaryTree.findOne({
      where: { userId: parentId },
    });
    if (userId === validateParentId_1LvGrandParent_isUserId.parentId) {
      const validateBinaryTree_parentIsLocation_same = await BinaryTree.findAll(
        {
          where: { parentId: parentId },
        }
      );

      if (validateBinaryTree_parentIsLocation_same.length >= 2) {
        throw new CustomError(400, "This parent's both leg are full");
      }

      if (validateBinaryTree_parentIsLocation_same.length === 1) {
        if (validateBinaryTree_parentIsLocation_same[0].position === position) {
          throw new CustomError(400, "This parent's leg now reserve");
        }
      }

      const createBinaryTree = await BinaryTree.create(
        {
          parentId: parentId,
          position: position,
          placeByUserId: userId,
          userId: placeId,
        },
        { transaction: transaction }
      );

      await transaction.commit();

      return res.status(400).json({ createBinaryTree });
    }

    /**
     * CASE: ParentId !== userId
     * AND ParentId is parent in DB is not userId
     * IF Binary line from ParentId to UserId is THE SAME POSITION
     * <can place position L and R>
     */
    const position_fromParentIdToUserId = [];

    async function checkBinaryLine_fromParentIdToUserId(params) {
      const Fn_arr = [];

      const resultFromDB = await BinaryTree.findAll({
        where: { user_id: params },
      });

      if (resultFromDB[0].userId === +userId) {
        return;
      }

      for (let i = 0; i < resultFromDB.length; i++) {
        let child = resultFromDB[i];

        await position_fromParentIdToUserId.push(child.position);

        await Fn_arr.push(child.parentId);

        await checkBinaryLine_fromParentIdToUserId(Fn_arr);
      }
    }

    await checkBinaryLine_fromParentIdToUserId([parentId]);

    const validate_position_fromParentIdToUserId = new Set(
      position_fromParentIdToUserId
    );

    if (validate_position_fromParentIdToUserId.size !== 1) {
      throw new CustomError(400, "Place position at this parentId is invalid");
    }

    const createBinaryTree = await BinaryTree.create(
      {
        parentId: parentId,
        position: position,
        placeByUserId: userId,
        userId: placeId,
      },
      { transaction: transaction }
    );

    await transaction.commit();

    return res.status(201).json({ createBinaryTree });
  } catch (error) {
    await transaction.rollback();

    console.log(error);

    next(error);
  }
};

/**
 * OLD CODE
 */
// exports.getUserPage = (req, res, next) => {
//   try {
//     res.status(200).send("<h1>This is User path</h1>");
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

// exports.getUserInfo = async (req, res, next) => {
//   try {
//     const { userId } = req.params;

//     const findUserDetail = await User.findOne({
//       where: { id: userId },
//     });

//     // ----- find DownLine User -----
//     let headUserId = [userId];
//     const headUserId_All_DownLineUserId = [];

//     let downLineUserId_forFn = [];

//     async function findDownLineOfThisHead_Fn(headIdArrParam) {
//       for (let i = 0; i < headIdArrParam.length; i++) {
//         const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
//           where: { userIdWhoCanEdit: headIdArrParam[i] },
//         });

//         for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
//           // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
//           if (
//             !headUserId_All_DownLineUserId.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             headUserId_All_DownLineUserId.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }

//           if (
//             !downLineUserId_forFn.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             downLineUserId_forFn.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }
//         }
//         // console.log(headUserId_All_DownLineUserId, "54");
//         // console.log(downLineUserId_forFn, "55");
//       }

//       for (let i = 0; i < downLineUserId_forFn.length; i++) {
//         const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
//           where: { userIdWhoCanEdit: downLineUserId_forFn[i] },
//         });

//         for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
//           // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
//           if (
//             !headUserId_All_DownLineUserId.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             headUserId_All_DownLineUserId.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }

//           if (
//             !downLineUserId_forFn.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             downLineUserId_forFn.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }
//         }
//         // console.log(headUserId_All_DownLineUserId, "85");
//         // console.log(downLineUserId_forFn, "86");
//       }
//     }

//     const RunQueryFunction = await findDownLineOfThisHead_Fn(headUserId);
//     // console.log(headUserId_All_DownLineUserId, "91");
//     // console.log(downLineUserId_forFn, "92");

//     headUserId_All_DownLineUserId.sort((a, b) => a - b);
//     findUserDetail.dataValues.downLineUser = headUserId_All_DownLineUserId;

//     if (!findUserDetail) {
//       return res.status(400).json({ message: "This user not found" });
//     }

//     // find user down line WHO not place
//     const findAll_userDownLine_notPlace = await User.findAll({
//       where: {
//         id: headUserId_All_DownLineUserId,
//         placePosition: null,
//         headIsUserId: null,
//       },
//     });
//     // --------------------------------------

//     return res.status(200).json({
//       user: findUserDetail,
//       downLineNotPlace: findAll_userDownLine_notPlace,
//     });
//   } catch (err) {
//     console.log(err);
//     next(err);
//   }
// };

// exports.register = async (req, res, next) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { username } = req.body;
//     let haveRefFromId = false;

//     if (!username || !username.trim()) {
//       throw new CustomError(400, "username is require");
//     }

//     // handler Reference Code
//     if (!req.body.refFrom || !req.body.refFrom.trim()) {
//       req.body.refFrom = null;
//     }

//     // Check duplicate username
//     const thisUsernameIsDuplicate = await User.findOne({
//       where: { username: username },
//     });

//     if (thisUsernameIsDuplicate) {
//       throw new CustomError(400, "This username already in database");
//     }

//     const findRefFrom = await User.findOne({
//       where: { thisUserRef: req.body.refFrom },
//     });

//     if (req.body.refFrom) {
//       if (!findRefFrom) {
//         throw new CustomError(400, "No ref code in database");
//       }
//       haveRefFromId = true;
//     }

//     // DB create data
//     if (!haveRefFromId) {
//       const createNewUser = await User.create({
//         username: username,
//         thisUserRef: Date.now(),
//         refFrom: req.body.refFrom,
//         refFromId: haveRefFromId ? findRefFrom.id : null,
//       });

//       return res.status(201).json({ createNewUser });
//     }

//     // if (haveRefFromId)
//     const createNewUser = await User.create(
//       {
//         username: username,
//         thisUserRef: Date.now(),
//         refFrom: req.body.refFrom,
//         refFromId: haveRefFromId ? findRefFrom.id : null,
//       },
//       {
//         transaction: transaction,
//       }
//     );

//     const createBinaryMap = await UserPlace.create(
//       {
//         userIdWhoCanEdit: findRefFrom.id,
//         userIdWhoGotEdit: createNewUser.id,
//       },
//       {
//         transaction: transaction,
//       }
//     );

//     await transaction.commit();

//     res.status(201).json({ createNewUser, createBinaryMap });
//   } catch (err) {
//     await transaction.rollback();

//     console.log(err);
//     next(err);
//   }
// };

// exports.placeDownLine = async (req, res, next) => {
//   const transaction = await sequelize.transaction();
//   try {
//     const { id } = req.params;
//     const { placeId, placeAtHeadUserId, placePosition } = req.body;

//     const validatePlacePosition = ["L", "R"];
//     let validatePlacePosition_count = 0;
//     Promise.all(
//       validatePlacePosition.map(async (item) => {
//         if (placePosition !== item) {
//           validatePlacePosition_count += 1;
//         }
//         if (placePosition !== item) {
//           validatePlacePosition_count += 1;
//         }
//       })
//     );
//     if (validatePlacePosition_count === 4) {
//       throw new CustomError(400, "placePosition value are invalid");
//     }

//     if (id == placeId) {
//       throw new CustomError(400, "You cannot place yourself");
//     }
//     if (placeId == placeAtHeadUserId) {
//       throw new CustomError(400, "placeAtHeadUserId must not equal to placeId");
//     }

//     const findUserDetail = await User.findOne({
//       where: { id: id },
//     });

//     if (!findUserDetail) {
//       throw new CustomError(400, "This user not found");
//     }

//     const findPlaceUserDetail = await User.findOne({
//       where: { id: placeId },
//     });

//     if (!findPlaceUserDetail) {
//       throw new CustomError(400, "This user you want to place not found");
//     }

//     if (
//       findPlaceUserDetail.placePosition !== null ||
//       findPlaceUserDetail.headIsUserId !== null
//     ) {
//       // console.log(findPlaceUserDetail);
//       throw new CustomError(
//         400,
//         "This user you want to place has already place"
//       );
//     }

//     const findPlaceAtHeadUserIdUserDetail = await User.findOne({
//       where: { id: placeAtHeadUserId },
//     });

//     if (!findPlaceAtHeadUserIdUserDetail) {
//       throw new CustomError(400, "This head user not found");
//     }

//     // find DownLine User section
//     let headUserId = [id];
//     const headUserId_All_DownLineUserId = [];

//     let downLineUserId_forFn = [];

//     async function findDownLineOfThisHead_Fn(headIdArrParam) {
//       for (let i = 0; i < headIdArrParam.length; i++) {
//         const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
//           where: { userIdWhoCanEdit: headIdArrParam[i] },
//         });

//         for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
//           // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
//           if (
//             !headUserId_All_DownLineUserId.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             headUserId_All_DownLineUserId.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }

//           if (
//             !downLineUserId_forFn.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             downLineUserId_forFn.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }
//         }
//         // console.log(headUserId_All_DownLineUserId, "54");
//         // console.log(downLineUserId_forFn, "55");

//         // return await result_findDownLineOfThisHead_Fn;
//       }

//       for (let i = 0; i < downLineUserId_forFn.length; i++) {
//         const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
//           where: { userIdWhoCanEdit: downLineUserId_forFn[i] },
//         });

//         for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
//           // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
//           if (
//             !headUserId_All_DownLineUserId.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             headUserId_All_DownLineUserId.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }

//           if (
//             !downLineUserId_forFn.includes(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             downLineUserId_forFn.push(
//               result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
//             );
//           }
//         }
//         // console.log(headUserId_All_DownLineUserId, "85");
//         // console.log(downLineUserId_forFn, "86");

//         // return await result_findDownLineOfThisHead_Fn;
//       }
//     }

//     const RunQueryFunction = await findDownLineOfThisHead_Fn(headUserId);

//     // find HeadLine User section
//     // let headUserId = [id]; // เอามาจากด้านบน
//     const headUserId_All_UpLineUserId = [];

//     let upLineUserId_forFn = [];

//     async function findUpLineOfThisHead_Fn(headIdArrParam) {
//       for (let i = 0; i < headIdArrParam.length; i++) {
//         const result_findUpLineOfThisHead_Fn = await UserPlace.findAll({
//           where: { userIdWhoGotEdit: headIdArrParam[i] },
//         });

//         for (let i = 0; i < result_findUpLineOfThisHead_Fn.length; i++) {
//           // console.log(result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit);
//           if (
//             !headUserId_All_UpLineUserId.includes(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             headUserId_All_UpLineUserId.push(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             );
//           }

//           if (
//             !upLineUserId_forFn.includes(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             upLineUserId_forFn.push(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             );
//           }
//         }
//         // console.log(headUserId_All_UpLineUserId, "54");
//         // console.log(upLineUserId_forFn, "55");

//         // return await result_findUpLineOfThisHead_Fn;
//       }

//       for (let i = 0; i < upLineUserId_forFn.length; i++) {
//         const result_findUpLineOfThisHead_Fn = await UserPlace.findAll({
//           where: { userIdWhoGotEdit: upLineUserId_forFn[i] },
//         });

//         for (let i = 0; i < result_findUpLineOfThisHead_Fn.length; i++) {
//           // console.log(result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit);
//           if (
//             !headUserId_All_UpLineUserId.includes(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             headUserId_All_UpLineUserId.push(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             );
//           }

//           if (
//             !upLineUserId_forFn.includes(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
//           ) {
//             upLineUserId_forFn.push(
//               result_findUpLineOfThisHead_Fn[i].userIdWhoCanEdit
//             );
//           }
//         }
//         // console.log(headUserId_All_UpLineUserId, "85");
//         // console.log(upLineUserId_forFn, "86");

//         // return await result_findUpLineOfThisHead_Fn;
//       }
//     }

//     const RunQueryFunction2 = await findUpLineOfThisHead_Fn(headUserId);
//     // console.log(RunQueryFunction2);
//     // console.log(headUserId_All_UpLineUserId);
//     // console.log(upLineUserId_forFn);

//     const findAll_userDownLine_notPlace = await User.findAll({
//       // attributes: ["id", "username"],
//       where: {
//         id: headUserId_All_DownLineUserId,
//         placePosition: null,
//         headIsUserId: null,
//       },
//     });
//     console.log(findAll_userDownLine_notPlace, "findAll_userDownLine_notPlace");

//     /**
//      * This function use to check param 1 and param 2 are matched.
//      * (work like filter but use reduce instead bcz async/await)
//      * ref link: https://michaelheap.com/async-array-filter/
//      * @param data1 - data you want to return.
//      * @param data2 - data use to check is match with data1.
//      * @returns data1
//      */
//     function findPlaceUserId_in_findAll_userDownLine_notPlace(data1, data2) {
//       if (data1 == data2) {
//         return data1;
//       }
//     }

//     /**
//      * use Reduce to filter in Async/Await.
//      * find that `placeId` user is `DOWN LINE` of headUser.
//      */
//     const userWantToPlace = await findAll_userDownLine_notPlace.reduce(
//       async (acc, item) => {
//         const result = await findPlaceUserId_in_findAll_userDownLine_notPlace(
//           item.id,
//           placeId
//         );

//         if (!result) {
//           return await acc;
//         }

//         return (await acc).concat(item);
//       },
//       []
//     );

//     if (userWantToPlace.length !== 1) {
//       throw new CustomError(
//         400,
//         "This user you want to place not found / or not you down line"
//       );
//     }

//     // throw new CustomError(999, "473");

//     // console.log(headUserId_All_DownLineUserId, "headUserId_All_DownLineUserId");

//     /**
//      * use Reduce to create Object-Array 2 keys(for UPDATE DB condition).
//      * `headLineId` for Place position at Head's Leg.
//      * `memberLineId` for Place position at member's Leg.
//      * his reduce [headUserId_All_DownLineUserId] swap `data === placeId(req.body)` with `headId(id in req.params)`
//      */
//     const placePositionCondition = await headUserId_All_DownLineUserId.reduce(
//       //////////////////////////////////////
//       async (acc, item) => {
//         if (item === +placeId) {
//           (await acc)["headLineId"].push(+id);
//         }
//         if (item !== +placeId) {
//           (await acc)["memberLineId"].push(item);
//         }
//         return await acc;
//       },
//       { headLineId: [], memberLineId: [] }
//     );
//     console.log(placePositionCondition, "placePositionCondition");

//     if (placePositionCondition.headLineId.length !== 1) {
//       throw new CustomError(400, "Head user must be only one");
//     }

//     /**
//      * use Reduce to filter in Async/Await.
//      * find that `placeAtHeadUserId` user is the same Binary Line with `placeId`.
//      * `concat for create Arr id of Binary line member.`
//      */
//     const isHeadPositionIsSameBinaryLine =
//       await placePositionCondition.headLineId
//         .concat(placePositionCondition.memberLineId)
//         .reduce(async (acc, item) => {
//           const result = await findPlaceUserId_in_findAll_userDownLine_notPlace(
//             item,
//             placeAtHeadUserId
//           );

//           if (!result) {
//             return await acc;
//           }

//           return (await acc).concat(item);
//         }, []);
//     // console.log(
//     //   isHeadPositionIsSameBinaryLine,
//     //   "isHeadPositionIsSameBinaryLine"
//     // );

//     // throw new CustomError(999, "526 error down here");

//     if (isHeadPositionIsSameBinaryLine.length === 0) {
//       throw new CustomError(
//         400,
//         "This head user is not in the same Binary line"
//       );
//     }

//     /**
//      * Validate: if Place Id is not the same as This User Id
//      * `headUser must be already place first`
//      */
//     let placeAtHeadUserId_isEqual_thisUserId = false;
//     if (placeAtHeadUserId !== id) {
//       Promise.all(
//         findAll_userDownLine_notPlace.map(async (item) => {
//           // console.log(item.dataValues);
//           // console.log(item.id);
//           // console.log(placeId);

//           if (+item.id == +placeAtHeadUserId) {
//             placeAtHeadUserId_isEqual_thisUserId = true;
//           }
//         })
//       );
//     }
//     if (placeAtHeadUserId_isEqual_thisUserId) {
//       throw new CustomError(
//         400,
//         "This head user is not yet place in Binary line"
//       );
//     }

//     /**
//      * Validate: find `placeAtHeadUserId`'s `Left` and/or `Right` Leg is available to place
//      */
//     const findDetail_placeAtHeadUserId = await User.findAll({
//       where: { headIsUserId: placeAtHeadUserId },
//     });

//     if (findDetail_placeAtHeadUserId.length >= 2) {
//       throw new CustomError(400, "This headUser's leg is full");
//     }

//     if (findDetail_placeAtHeadUserId.length === 1) {
//       if (findDetail_placeAtHeadUserId[0].placePosition === placePosition) {
//         throw new CustomError(400, "This headUser's leg is now reserve");
//       }
//     }

//     // console.log(
//     //   findDetail_placeAtHeadUserId.length,
//     //   "findDetail_placeAtHeadUserId"
//     // );

//     throw new CustomError(999, "TEST");

//     const updateResult = await User.update(
//       { headIsUserId: placeAtHeadUserId, placePosition: placePosition },
//       {
//         where: { id: placeId },
//       },
//       {
//         transaction: transaction,
//       }
//     );

//     if (!updateResult) {
//       throw new CustomError(400, "update database error");
//     }

//     await transaction.commit();

//     res.status(204).json({
//       message: "update user database successful",
//       // userWantToPlace,
//       // findAll_userDownLine_notPlace,
//       // findDetail_placeAtHeadUserId,
//       // updateResult,
//     });
//   } catch (err) {
//     await transaction.rollback();

//     console.log(err);
//     next(err);
//   }
// };
