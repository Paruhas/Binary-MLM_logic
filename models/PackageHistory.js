module.exports = (sequelize, DataTypes) => {
  const PackageHistory = sequelize.define(
    "PackageHistory",
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

  PackageHistory.associate = (models) => {
    PackageHistory.belongsTo(models.Package, {
      foreignKey: {
        name: "packageId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    PackageHistory.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return PackageHistory;
};
