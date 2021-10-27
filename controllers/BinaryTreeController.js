const { Op } = require("sequelize");
const { sequelize, User, BinaryTree } = require("../models");
const CustomError = require("../utils/CustomError");

exports.getBinaryTriangle = async (req, res, next) => {
  try {
    const { refKey } = req.params;
    const { id } = req.query;

    const isId = id === "true";

    const findById = { id: refKey };
    const findByRefKey = { userRefKey: refKey };

    let searchById = false;
    if (isId) {
      searchById = true;
    }

    const userData = await User.findOne({
      where: searchById ? findById : findByRefKey,
      include: [
        {
          model: BinaryTree,
          as: "childId",
          include: [{ model: User, as: "userData" }],
        },
      ],
    });

    if (!userData) {
      throw new CustomError(400, "User not found");
    }

    return res.status(200).json({ userData });
  } catch (error) {
    console.log(error);

    next(error);
  }
};
