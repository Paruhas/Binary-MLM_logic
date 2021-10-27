module.exports = (sequelize, DataTypes) => {
  const BinaryRank = sequelize.define(
    "BinaryRank",
    {
      rankLevel: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      maxPayment: {
        type: DataTypes.DECIMAL(19, 4),
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  BinaryRank.associate = (models) => {
    BinaryRank.hasOne(models.UserBinaryRank, {
      foreignKey: {
        name: "binaryRankId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return BinaryRank;
};
