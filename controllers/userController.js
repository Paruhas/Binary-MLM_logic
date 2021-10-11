const { User, UserPlace, sequelize } = require("../models");

exports.getUserPage = (req, res, next) => {
  try {
    res.status(200).send("<h1>This is User path</h1>");
  } catch (err) {
    console.log(err);
    next(error);
  }
};

exports.getUserInfo = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const findUserDetail = await User.findOne({
      where: { id: userId },
    });

    // ----- find DownLine User -----
    let headUserId = [userId];
    const headUserId_All_DownLineUserId = [];

    let downLineUserId_forFn = [];

    async function findDownLineOfThisHead_Fn(headIdArrParam) {
      for (let i = 0; i < headIdArrParam.length; i++) {
        const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
          where: { userIdWhoCanEdit: headIdArrParam[i] },
        });

        for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
          // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
          if (
            !headUserId_All_DownLineUserId.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            headUserId_All_DownLineUserId.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }

          if (
            !downLineUserId_forFn.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            downLineUserId_forFn.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }
        }
        // console.log(headUserId_All_DownLineUserId, "54");
        // console.log(downLineUserId_forFn, "55");
      }

      for (let i = 0; i < downLineUserId_forFn.length; i++) {
        const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
          where: { userIdWhoCanEdit: downLineUserId_forFn[i] },
        });

        for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
          // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
          if (
            !headUserId_All_DownLineUserId.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            headUserId_All_DownLineUserId.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }

          if (
            !downLineUserId_forFn.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            downLineUserId_forFn.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }
        }
        // console.log(headUserId_All_DownLineUserId, "85");
        // console.log(downLineUserId_forFn, "86");
      }
    }

    const RunQueryFunction = await findDownLineOfThisHead_Fn(headUserId);
    // console.log(headUserId_All_DownLineUserId, "91");
    // console.log(downLineUserId_forFn, "92");

    headUserId_All_DownLineUserId.sort((a, b) => a - b);
    findUserDetail.dataValues.downLineUser = headUserId_All_DownLineUserId;

    if (!findUserDetail) {
      return res.status(400).json({ message: "This user not found" });
    }

    // find user down line WHO not place
    const findAll_userDownLine_notPlace = await User.findAll({
      where: {
        id: headUserId_All_DownLineUserId,
        placePosition: null,
        headIsUserId: null,
      },
    });
    // --------------------------------------

    return res.status(200).json({
      user: findUserDetail,
      downLineNotPlace: findAll_userDownLine_notPlace,
    });
  } catch (err) {
    console.log(err);
    next(error);
  }
};

exports.register = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { username } = req.body;
    let haveRefFromId = false;

    if (!username || !username.trim()) {
      throw new CustomError(400, "username is require");
    }

    // handler Reference Code
    if (!req.body.refFrom || !req.body.refFrom.trim()) {
      req.body.refFrom = null;
    }

    // Check duplicate username
    const thisUsernameIsDuplicate = await User.findOne({
      where: { username: username },
    });

    if (thisUsernameIsDuplicate) {
      throw new CustomError(400, "This username already in database");
    }

    const findRefFrom = await User.findOne({
      where: { thisUserRef: req.body.refFrom },
    });

    if (req.body.refFrom) {
      if (!findRefFrom) {
        throw new CustomError(400, "No ref code in database");
      }
      haveRefFromId = true;
    }

    // DB create data
    if (!haveRefFromId) {
      const createNewUser = await User.create({
        username: username,
        thisUserRef: Date.now(),
        refFrom: req.body.refFrom,
        refFromId: haveRefFromId ? findRefFrom.id : null,
      });

      return res.status(201).json({ createNewUser });
    }

    // if (haveRefFromId)
    const createNewUser = await User.create(
      {
        username: username,
        thisUserRef: Date.now(),
        refFrom: req.body.refFrom,
        refFromId: haveRefFromId ? findRefFrom.id : null,
      },
      {
        transaction: transaction,
      }
    );

    const createBinaryMap = await UserPlace.create(
      {
        userIdWhoCanEdit: findRefFrom.id,
        userIdWhoGotEdit: createNewUser.id,
      },
      {
        transaction: transaction,
      }
    );

    await transaction.commit();

    res.status(201).json({ createNewUser, createBinaryMap });
  } catch (err) {
    await transaction.rollback();

    console.log(err);
    next(error);
  }
};

exports.placeDownLine = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { placeId, placeAtHeadUserId, placePosition } = req.body;

    const validatePlacePosition = ["L", "R"];
    let validatePlacePosition_count = 0;
    Promise.all(
      validatePlacePosition.map(async (item) => {
        if (placePosition !== item) {
          validatePlacePosition_count += 1;
        }
        if (placePosition !== item) {
          validatePlacePosition_count += 1;
        }
      })
    );
    if (validatePlacePosition_count === 4) {
      throw new CustomError(400, "placePosition value are invalid");
    }

    if (id == placeId) {
      throw new CustomError(400, "You cannot place yourself");
    }
    if (placeId == placeAtHeadUserId) {
      throw new CustomError(400, "placeAtHeadUserId must not equal to placeId");
    }

    const findUserDetail = await User.findOne({
      where: { id: id },
    });

    if (!findUserDetail) {
      throw new CustomError(400, "This user not found");
    }

    const findPlaceUserDetail = await User.findOne({
      where: { id: placeId },
    });

    if (!findPlaceUserDetail) {
      throw new CustomError(400, "This user you want to place not found");
    }

    if (
      findPlaceUserDetail.placePosition !== null ||
      findPlaceUserDetail.headIsUserId !== null
    ) {
      // console.log(findPlaceUserDetail);
      throw new CustomError(
        400,
        "This user you want to place has already place"
      );
    }

    const findPlaceAtHeadUserIdUserDetail = await User.findOne({
      where: { id: placeAtHeadUserId },
    });

    if (!findPlaceAtHeadUserIdUserDetail) {
      throw new CustomError(400, "This head user not found");
    }

    // find DownLine User section
    let headUserId = [id];
    const headUserId_All_DownLineUserId = [];

    let downLineUserId_forFn = [];

    async function findDownLineOfThisHead_Fn(headIdArrParam) {
      for (let i = 0; i < headIdArrParam.length; i++) {
        const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
          where: { userIdWhoCanEdit: headIdArrParam[i] },
        });

        for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
          // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
          if (
            !headUserId_All_DownLineUserId.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            headUserId_All_DownLineUserId.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }

          if (
            !downLineUserId_forFn.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            downLineUserId_forFn.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }
        }
        // console.log(headUserId_All_DownLineUserId, "54");
        // console.log(downLineUserId_forFn, "55");
      }

      for (let i = 0; i < downLineUserId_forFn.length; i++) {
        const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
          where: { userIdWhoCanEdit: downLineUserId_forFn[i] },
        });

        for (let i = 0; i < result_findDownLineOfThisHead_Fn.length; i++) {
          // console.log(result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit);
          if (
            !headUserId_All_DownLineUserId.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            headUserId_All_DownLineUserId.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }

          if (
            !downLineUserId_forFn.includes(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
          ) {
            downLineUserId_forFn.push(
              result_findDownLineOfThisHead_Fn[i].userIdWhoGotEdit
            );
          }
        }
        // console.log(headUserId_All_DownLineUserId, "85");
        // console.log(downLineUserId_forFn, "86");
      }
    }

    const RunQueryFunction = await findDownLineOfThisHead_Fn(headUserId);

    const findAll_userDownLine_notPlace = await User.findAll({
      // attributes: ["id", "username"],
      where: {
        id: headUserId_All_DownLineUserId,
        placePosition: null,
        headIsUserId: null,
      },
    });
    // console.log(findAll_userDownLine_notPlace, "findAll_userDownLine_notPlace");

    /**
     * This function use to check param 1 and param 2 are matched.
     * (work like filter but use reduce instead bcz async/await)
     * ref link: https://michaelheap.com/async-array-filter/
     * @param data1 - data you want to return.
     * @param data2 - data use to check is match with data1.
     * @returns data1
     */
    function findPlaceUserId_in_findAll_userDownLine_notPlace(data1, data2) {
      if (data1 == data2) {
        return data1;
      }
    }

    /**
     * use Reduce to filter in Async/Await.
     * find that `placeId` user is `DOWN LINE` of headUser.
     */
    const userWantToPlace = await findAll_userDownLine_notPlace.reduce(
      async (acc, item) => {
        const result = await findPlaceUserId_in_findAll_userDownLine_notPlace(
          item.id,
          placeId
        );

        if (!result) {
          return await acc;
        }

        return (await acc).concat(item);
      },
      []
    );

    if (userWantToPlace.length !== 1) {
      throw new CustomError(
        400,
        "This user you want to place not found / or not you down line"
      );
    }

    // console.log(headUserId_All_DownLineUserId, "headUserId_All_DownLineUserId");

    /**
     * use Reduce to create Object-Array 2 keys(for UPDATE DB condition).
     * `headLineId` for Place position at Head's Leg.
     * `memberLineId` for Place position at member's Leg.
     * his reduce [headUserId_All_DownLineUserId] swap `data === placeId(req.body)` with `headId(id in req.params)`
     */
    const placePositionCondition = await headUserId_All_DownLineUserId.reduce(
      async (acc, item) => {
        if (item === +placeId) {
          (await acc)["headLineId"].push(+id);
        }
        if (item !== +placeId) {
          (await acc)["memberLineId"].push(item);
        }
        return await acc;
      },
      { headLineId: [], memberLineId: [] }
    );
    // console.log(placePositionCondition, "placePositionCondition");

    if (placePositionCondition.headLineId.length !== 1) {
      throw new CustomError(400, "Head user must be only one");
    }

    /**
     * use Reduce to filter in Async/Await.
     * find that `placeAtHeadUserId` user is the same Binary Line with `placeId`.
     * `concat for create Arr id of Binary line member.`
     */
    const isHeadPositionIsSameBinaryLine =
      await placePositionCondition.headLineId
        .concat(placePositionCondition.memberLineId)
        .reduce(async (acc, item) => {
          const result = await findPlaceUserId_in_findAll_userDownLine_notPlace(
            item,
            placeAtHeadUserId
          );

          if (!result) {
            return await acc;
          }

          return (await acc).concat(item);
        }, []);
    // console.log(
    //   isHeadPositionIsSameBinaryLine,
    //   "isHeadPositionIsSameBinaryLine"
    // );

    if (isHeadPositionIsSameBinaryLine.length === 0) {
      throw new CustomError(
        400,
        "This head user is not in the same Binary line"
      );
    }

    /**
     * Validate: if Place Id is not the same as This User Id
     * `headUser must be already place first`
     */

    if (placeAtHeadUserId !== id) {
      Promise.all(
        findAll_userDownLine_notPlace.map(async (item) => {
          // console.log(item.dataValues);
          // console.log(item.id);
          // console.log(placeId);

          if (item.id === +placeAtHeadUserId) {
            throw new CustomError(
              400,
              "This head user is not yet place in Binary line"
            );
          }
        })
      );
    }

    /**
     * Validate: find `placeAtHeadUserId`'s `Left` and/or `Right` Leg is available to place
     */
    const findDetail_placeAtHeadUserId = await User.findAll({
      where: { headIsUserId: placeAtHeadUserId },
    });

    if (findDetail_placeAtHeadUserId.length >= 2) {
      throw new CustomError(400, "This headUser's leg is full");
    }

    if (findDetail_placeAtHeadUserId.length === 1) {
      if (findDetail_placeAtHeadUserId[0].placePosition === placePosition) {
        throw new CustomError(400, "This headUser's leg is now reserve");
      }
    }

    // console.log(
    //   findDetail_placeAtHeadUserId.length,
    //   "findDetail_placeAtHeadUserId"
    // );

    const updateResult = await User.update(
      { headIsUserId: placeAtHeadUserId, placePosition: placePosition },
      {
        where: { id: placeId },
      },
      {
        transaction: transaction,
      }
    );

    if (!updateResult) {
      throw new CustomError(400, "update database error");
    }

    await transaction.commit();

    res.status(204).json({
      message: "update user database successful",
      // userWantToPlace,
      // findAll_userDownLine_notPlace,
      // findDetail_placeAtHeadUserId,
      // updateResult,
    });
  } catch (err) {
    await transaction.rollback();

    console.log(err);
    next(error);
  }
};
