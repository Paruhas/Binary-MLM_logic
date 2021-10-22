const { Op } = require("sequelize");
const { sequelize, User, BinaryTree } = require("../models");
const CustomError = require("../utils/CustomError");

exports.getBinaryTriangle = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const userData = await User.findOne({
      where: { id: userId },
    });

    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    const binaryTriangleData = await BinaryTree.findAll({
      where: { parentId: userId },
      include: User,
    });

    const userDataClone = { ...userData.dataValues };

    if (binaryTriangleData.length !== 0) {
      for (let i = 0; i < binaryTriangleData.length; i++) {
        if (binaryTriangleData[i].position == "L") {
          userDataClone.BinaryTriangle_L = binaryTriangleData[i].User;
        }
        if (binaryTriangleData[i].position == "R") {
          userDataClone.BinaryTriangle_R = binaryTriangleData[i].User;
        }
      }
    }

    if (!userDataClone.BinaryTriangle_L) {
      userDataClone.BinaryTriangle_L = null;
    }
    if (!userDataClone.BinaryTriangle_R) {
      userDataClone.BinaryTriangle_R = null;
    }

    return res.status(200).json({
      userData: userDataClone,
    });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
