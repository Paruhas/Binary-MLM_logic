module.exports = (sequelize, DataTypes) => {
  const UserPlace = sequelize.define(
    "UserPlace",
    {
      // userIdWhoCanEdit: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
      // userIdWhoGotEdit: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      // },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  UserPlace.associate = (models) => {
    UserPlace.belongsTo(models.User, {
      foreignKey: {
        name: "userIdWhoCanEdit",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    UserPlace.belongsTo(models.User, {
      foreignKey: {
        name: "userIdWhoGotEdit",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return UserPlace;
};
