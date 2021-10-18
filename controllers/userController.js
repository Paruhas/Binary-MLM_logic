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
