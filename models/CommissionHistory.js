module.exports = (sequelize, DataTypes) => {
  const CommissionHistory = sequelize.define(
    "CommissionHistory",
    {
      commissionBeforePay: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      commissionPay: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
      payStatus: {
        type: DataTypes.ENUM("PAID", "NOT_PAID"),
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  CommissionHistory.associate = (models) => {
    CommissionHistory.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return CommissionHistory;
};
