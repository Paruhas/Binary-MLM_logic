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
      // include: [
      //   {
      //     model: UserPlace,
      //     attributes: [["user_id_who_got_edit", "canEditId"]],
      //     // include: [
      //     //   {
      //     //     model: User,
      //     //   },
      //     // ],
      //   },
      // ],
    });

    // const userDownLine = [];
    // // console.log(findUserDetail[0].UserPlaces);
    // findUserDetail[0].UserPlaces.map((item) => {
    //   // console.log(item.userIdWhoGotEdit);
    //   userDownLine.push(item.userIdWhoGotEdit);
    // });
    // console.log(userDownLine, "userDownLine");

    // const findUserDetailUpperLevel = await UserPlace.findAll({
    //   where: {
    //     userIdWhoGotEdit: userDownLine,
    //   },
    // });

    // console.log(findUserDetailUpperLevel, "findUserDetailUpperLevel");

    // // ------ TEST 2 ------
    // const relateUserIdUp = [];
    // const relateUserIdDown = [];
    // const relateUserIdDown2 = [];
    // const relateUserIdDown3 = [];

    // const idThatThisUserWillGotEdit = await UserPlace.findAll({
    //   where: { userIdWhoGotEdit: userId },
    // });
    // // console.log(idThatThisUserWillGotEdit);
    // idThatThisUserWillGotEdit.map((item) => {
    //   // console.log(item);
    //   relateUserIdUp.push(item.userIdWhoCanEdit);
    // });

    // const idThatThisUserCanEdit = await UserPlace.findAll({
    //   where: { userIdWhoCanEdit: userId },
    // });
    // // console.log(idThatThisUserCanEdit);
    // idThatThisUserCanEdit.map((item) => {
    //   // console.log(item);
    //   relateUserIdDown.push(item.userIdWhoGotEdit);
    // });

    // console.log(relateUserIdUp, "relateUserIdUp");
    // console.log(relateUserIdDown, "relateUserIdDown");

    // const thisIdHadDownLine2 = await UserPlace.findAll({
    //   where: { userIdWhoCanEdit: relateUserIdDown },
    // });
    // // console.log(thisIdHadDownLine2, "thisIdHadDownLine2");
    // thisIdHadDownLine2.map((item) => {
    //   // console.log(item);
    //   relateUserIdDown2.push(item.userIdWhoGotEdit);
    // });
    // console.log(relateUserIdDown2, "relateUserIdDown2");

    // const thisIdHadDownLine3 = await UserPlace.findAll({
    //   where: { userIdWhoCanEdit: relateUserIdDown2 },
    // });
    // // console.log(thisIdHadDownLine3, "thisIdHadDownLine3");
    // thisIdHadDownLine3.map((item) => {
    //   // console.log(item);
    //   relateUserIdDown3.push(item.userIdWhoGotEdit);
    // });
    // console.log(relateUserIdDown3, "relateUserIdDown3");

    // // ------ TEST 2 ------ END

    // ------ TEST 3 ------
    let headUserId = [userId];
    let downLineId_headUserId = [];

    const headUserId_All_DownLineUserId = [];

    let downLineUserId_forFn = [];

    // let findDownLineOfThisHead = await UserPlace.findAll({
    //   // attributes: [["user_id_who_got_edit", "canEditId"]],
    //   where: { user_id_who_can_edit: HeadUserId },
    // });

    // console.log(findDownLineOfThisHead);

    async function findDownLineOfThisHead_Fn(headIdArr) {
      for (let i = 0; i < headIdArr.length; i++) {
        const result_findDownLineOfThisHead_Fn = await UserPlace.findAll({
          where: { userIdWhoCanEdit: headIdArr[i] },
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
        // console.log(headUserId_All_DownLineUserId, "140");
        // console.log(downLineUserId_forFn, "141");

        // return result_findDownLineOfThisHead_Fn;
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
      }
    }

    const test = await findDownLineOfThisHead_Fn(headUserId);
    // console.log(test);
    // test.forEach((item) => console.log(item.userIdWhoGotEdit));
    // console.log(headUserId_All_DownLineUserId, "148");
    // console.log(downLineUserId_forFn, "149");

    // find user down line WHO not place
    const findNotPlaceUserDownLine = await User.findAll({
      where: { id: headUserId_All_DownLineUserId, placePosition: null },
    });

    return res.status(400).json({
      message: "TEST",
      findUserDetail,
      // downLineUserId_forFn: downLineUserId_forFn,
      headUserId_All_DownLineUserId: headUserId_All_DownLineUserId,
      findNotPlaceUserDownLine,
    });

    // console.log(findDownLineOfThisHead.length); // หา length เอาไปทำ for loop

    // for loop push UserId ที่เป็น downLine เข้าไป
    for (let i = 0; i < findDownLineOfThisHead.length; i++) {
      // console.log(findDownLineOfThisHead[i].userIdWhoGotEdit);
      if (
        !headUserId_All_DownLineUserId.includes(
          findDownLineOfThisHead[i].userIdWhoGotEdit
        ) // check ว่า ถ้ามีค่าซ้ำ เราจะไม่ยัดอันใหม่ลงไป
      ) {
        headUserId_All_DownLineUserId.push(
          findDownLineOfThisHead[i].userIdWhoGotEdit
        );
      }
    }

    console.log({
      headUserId_All_DownLineUserId: headUserId_All_DownLineUserId,
    });

    headUserId_All_DownLineUserId.forEach((item) => {
      console.log(item);
    });

    return res.status(200).json({ HeadUserId, findDownLineOfThisHead });
    // ------ TEST 3 ------ END

    if (!findUserDetail) {
      return res.status(400).json({ message: "This user not found" });
    }

    res.status(200).json({ findUserDetail });
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
