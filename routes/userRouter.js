const express = require("express");
const { User, UserPlace, sequelize } = require("../models");
const userRouter = express.Router();

userRouter.get("/", (req, res, next) => {
  try {
    res.status(200).send("<h1>This is User path</h1>");
  } catch (err) {
    console.log(err);
  }
});

userRouter.get("/info/:userId", async (req, res, next) => {
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
  }
});

userRouter.post("/register", async (req, res, next) => {
  try {
    const { username } = req.body;
    let haveRefFromId = false;

    // Check duplicate username
    const thisUsernameIsDuplicate = await User.findOne({
      where: { username: username },
    });

    if (thisUsernameIsDuplicate) {
      return res
        .status(400)
        .json({ message: "This username already in database" });
    }

    // handler Reference Code
    if (!req.body.refFrom || !req.body.refFrom.trim()) {
      req.body.refFrom = null;
    }

    const findRefFrom = await User.findOne({
      where: { thisUserRef: req.body.refFrom },
    });

    if (req.body.refFrom) {
      if (!findRefFrom) {
        return res.status(400).json({ message: "No ref code in database" });
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
    const createNewUser = await User.create({
      username: username,
      thisUserRef: Date.now(),
      refFrom: req.body.refFrom,
      refFromId: haveRefFromId ? findRefFrom.id : null,
    });

    const createBinaryMap = await UserPlace.create({
      userIdWhoCanEdit: findRefFrom.id,
      userIdWhoGotEdit: createNewUser.id,
    });

    res.status(201).json({ createNewUser, createBinaryMap });
  } catch (err) {
    console.log(err);
  }
});

userRouter.patch("/:id/place", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { placeId, placeAtHeadUserId, placePosition } = req.body;

    if (id == placeId) {
      return res.status(400).json({ message: "You cannot place yourself" });
    }

    const findUserDetail = await User.findOne({
      where: { id: id },
    });

    if (!findUserDetail) {
      return res.status(400).json({ message: "This user not found" });
    }

    const findPlaceUserDetail = await User.findOne({
      where: { id: placeId },
    });

    if (!findPlaceUserDetail) {
      return res
        .status(400)
        .json({ message: "This user you want to place not found" });
    }

    if (
      findPlaceUserDetail.placePosition !== null ||
      findPlaceUserDetail.headIsUserId !== null
    ) {
      return res
        .status(400)
        .json({ message: "This user you want to place has already place" });
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
      return res.status(400).json({
        message: "This user you want to place not found / or not you down line",
      });
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
      return res.status(400).json({
        message: "This head user is not in the same Binary line",
      });
    }

    /**
     * Validate: find `placeAtHeadUserId`'s `Left` and/or `Right` Leg is available to place
     */
    const findDetail_placeAtHeadUserId = await User.findAll({
      where: { headIsUserId: placeAtHeadUserId },
    });

    if (findDetail_placeAtHeadUserId.length >= 2) {
      return res.status(400).json({ message: "This headUser's leg is full" });
    }

    if (findDetail_placeAtHeadUserId.length === 1) {
      if (findDetail_placeAtHeadUserId.placePosition === placePosition) {
        return res
          .status(400)
          .json({ message: "This headUser's leg is now reserve" });
      }
    }

    // validate headUser must be place first!! (if not headLineId) { headLineId: [], memberLineId: [] }

    const updateResult = await User.update(
      { headIsUserId: placeAtHeadUserId, placePosition: placePosition },
      {
        where: { id: placeId },
      }
    );

    if (!updateResult) {
      return res.status(400).json({ message: "update database error" });
    }

    res.status(200).json({
      message: "update database successful",
      userWantToPlace,
      findAll_userDownLine_notPlace,
      findDetail_placeAtHeadUserId,
      updateResult,
    });
  } catch (err) {
    console.log(err);
  }
});

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

// userRouter.post("/", (req, res, next) => {
//   try {
//   } catch (err) {
//     console.log(err);
//   }
// });

module.exports = userRouter;
