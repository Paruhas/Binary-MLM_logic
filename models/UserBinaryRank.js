module.exports = (sequelize, DataTypes) => {
  const UserBinaryRank = sequelize.define(
    "UserBinaryRank",
    {
      totalCommissionPoint: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  UserBinaryRank.associate = (models) => {
    UserBinaryRank.belongsTo(models.BinaryRank, {
      foreignKey: {
        name: "BinaryRankId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    UserBinaryRank.belongsTo(models.User, {
      foreignKey: {
        name: "UserId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return UserBinaryRank;
};
