module.exports = (sequelize, DataTypes) => {
  const PackageDuration = sequelize.define(
    "PackageDuration",
    {
      expireDate: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      packageStatus: {
        type: DataTypes.ENUM("INACTIVE", "ACTIVE"),
        defaultValue: "INACTIVE",
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  PackageDuration.associate = (models) => {
    PackageDuration.belongsTo(models.User, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return PackageDuration;
};
