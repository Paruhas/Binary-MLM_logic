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

userRouter.post("/info", async (req, res, next) => {
  try {
    const { userId } = req.body;

    const findUserDetail = await User.findOne({
      where: { id: userId },
      // include: [
      //   {
      //     model: UserPlace,
      //     attributes: ["userIdWhoGotEdit"],
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

    // ------ TEST 2 ------
    const relateUserIdUp = [];
    const relateUserIdDown = [];
    const relateUserIdDown2 = [];
    const relateUserIdDown3 = [];

    const idThatThisUserWillGotEdit = await UserPlace.findAll({
      where: { userIdWhoGotEdit: userId },
    });
    // console.log(idThatThisUserWillGotEdit);
    idThatThisUserWillGotEdit.map((item) => {
      // console.log(item);
      relateUserIdUp.push(item.userIdWhoCanEdit);
    });

    const idThatThisUserCanEdit = await UserPlace.findAll({
      where: { userIdWhoCanEdit: userId },
    });
    // console.log(idThatThisUserCanEdit);
    idThatThisUserCanEdit.map((item) => {
      // console.log(item);
      relateUserIdDown.push(item.userIdWhoGotEdit);
    });

    console.log(relateUserIdUp, "relateUserIdUp");
    console.log(relateUserIdDown, "relateUserIdDown");

    const thisIdHadDownLine2 = await UserPlace.findAll({
      where: { userIdWhoCanEdit: relateUserIdDown },
    });
    // console.log(thisIdHadDownLine2, "thisIdHadDownLine2");
    thisIdHadDownLine2.map((item) => {
      // console.log(item);
      relateUserIdDown2.push(item.userIdWhoGotEdit);
    });
    console.log(relateUserIdDown2, "relateUserIdDown2");

    const thisIdHadDownLine3 = await UserPlace.findAll({
      where: { userIdWhoCanEdit: relateUserIdDown2 },
    });
    // console.log(thisIdHadDownLine3, "thisIdHadDownLine3");
    thisIdHadDownLine3.map((item) => {
      // console.log(item);
      relateUserIdDown3.push(item.userIdWhoGotEdit);
    });
    console.log(relateUserIdDown3, "relateUserIdDown3");

    // ------ TEST 2 ------ END

    if (!findUserDetail) {
      return res.status(400).json({ message: "This user not found" });
    }

    res.status(200).json({ findUserDetail });
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
