module.exports = (sequelize, DataTypes) => {
  const PackageOrder = sequelize.define(
    "PackageOrder",
    {
      packageName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      packageDescription: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      packagePrice: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      packageDuration: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  PackageOrder.associate = (models) => {
    PackageOrder.belongsTo(models.Package, {
      foreignKey: {
        name: "packageId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    PackageOrder.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return PackageOrder;
};
