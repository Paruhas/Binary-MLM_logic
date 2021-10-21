module.exports = (sequelize, DataTypes) => {
  const CommissionCalculator = sequelize.define(
    "CommissionCalculator",
    {
      totalPackageBuy: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      packageBuyForCalculator: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  CommissionCalculator.associate = (models) => {
    CommissionCalculator.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return CommissionCalculator;
};
