const { sequelize, Package } = require("../models");

exports.getAllPackages = async (req, res, next) => {
  try {
    const allPackagesData = await Package.findAll({});

    res.status(200).json({ allPackagesData });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.getPackageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const packageData = await Package.findOne({ where: { id: id } });

    if (!packageData) {
      return res.status(400).json({ message: "package not found" });
    }

    res.status(200).json({ packageData });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

exports.createPackage = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { name, price, duration } = req.body;

    if (!name || !name.trim()) {
      throw new CustomError(400, "name is require");
    }
    if (!price || !price.trim()) {
      throw new CustomError(400, "price is require");
    }
    if (!+price > 0) {
      throw new CustomError(400, "price must be int and not minus");
    }
    if (!duration || !duration.trim()) {
      throw new CustomError(400, "duration is require");
    }

    if (!req.body.description || !req.body.description.trim()) {
      req.body.description = null;
    }

    const createPackage = await Package.create(
      {
        name: name,
        description: req.body.description,
        price: price,
        duration: duration,
      },
      {
        transaction: transaction,
      }
    );

    await transaction.commit();

    res
      .status(201)
      .json({ message: "create new package successful", createPackage });
  } catch (error) {
    await transaction.rollback();

    console.log(error);
    next(error);
  }
};

exports.updatePackage = async (req, res, next) => {
  try {
    const { id } = req.params;
    let { name, description, price, duration } = req.body;

    if (
      (!name && !description && !price && !duration) ||
      (!name.trim() && !description.trim() && !price.trim() && !duration.trim())
    ) {
      return res.status(400).json({
        message: "ERROR cannot enter update process, all value are empty",
      });
    }

    const findPackageOldData = await Package.findOne({ where: { id: id } });

    if (!findPackageOldData) {
      return res.status(400).json({ message: "package not found" });
    }

    if (!name || !name.trim()) {
      name = findPackageOldData.name;
    }
    if (!description || !description.trim()) {
      description = findPackageOldData.description;
    }
    if (!price || !price.trim()) {
      price = findPackageOldData.price;
    }
    if (!+price > 0) {
      return res
        .status(400)
        .json({ message: "price must be int and not minus" });
    }
    if (!duration || !duration.trim()) {
      duration = findPackageOldData.duration;
    }

    const updatePackage = await Package.update(
      {
        name: name,
        description: description,
        price: price,
        duration: duration,
      },
      {
        where: { id: id },
      }
    );

    if (!updatePackage) {
      return res.status(400).json({ message: "update database error" });
    }

    const findPackageNewData = await Package.findOne({ where: { id: id } });

    res.status(201).json({
      message: "update package database successful",
      findPackageNewData,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
