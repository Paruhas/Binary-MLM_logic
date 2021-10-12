module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refCode: {
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
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  User.associate = (models) => {
    User.hasOne(models.PackageDuration, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasMany(models.PackageHistory, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasMany(models.InvitedHistory, {
      foreignKey: {
        name: "userInviteSend",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    User.hasOne(models.InvitedHistory, {
      foreignKey: {
        name: "userInvited",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasOne(models.BinaryTree, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return User;
};
