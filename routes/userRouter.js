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

    // find user down line WHO not place
    const findNotPlaceUserDownLine = await User.findAll({
      where: { id: headUserId_All_DownLineUserId, placePosition: null },
    });
    // --------------------------------------

    headUserId_All_DownLineUserId.sort((a, b) => a - b);
    findUserDetail.dataValues.downLineUser = headUserId_All_DownLineUserId;

    if (!findUserDetail) {
      return res.status(400).json({ message: "This user not found" });
    }

    return res.status(200).json({
      user: findUserDetail,
      downLineNotPlace: findNotPlaceUserDownLine,
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

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

userRouter.post("/", (req, res, next) => {
  try {
  } catch (err) {
    console.log(err);
  }
});

module.exports = userRouter;
