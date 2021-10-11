module.exports = (sequelize, DataTypes) => {
  const OrderHistory_PackageBuy = sequelize.define(
    "OrderHistory_PackageBuy",
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

  /**
   * check อีกรอบด้วย
   */
  OrderHistory_PackageBuy.associate = (models) => {
    OrderHistory_PackageBuy.belongsTo(models.Package, {
      foreignKey: {
        name: "packageId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    OrderHistory_PackageBuy.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return OrderHistory_PackageBuy;
};
