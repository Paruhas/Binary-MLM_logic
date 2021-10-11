module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      thisUserRef: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refFrom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refFromId: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      /**
       * Binary tree Position(Where get Place)
       */
      placePosition: {
        type: DataTypes.ENUM("L", "R"),
        allowNull: true,
        defaultValue: null,
      },
      headIsUserId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.hasMany(models.UserPlace, {
      foreignKey: {
        name: "userIdWhoCanEdit",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasOne(models.UserPlace, {
      foreignKey: {
        name: "userIdWhoGotEdit",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    /**
     * check อีกรอบด้วย
     */
    User.hasMany(models.OrderHistory_PackageBuy, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return User;
};
