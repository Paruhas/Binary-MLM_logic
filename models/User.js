module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refCodeL: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refCodeR: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      refFrom: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      refFromUserId: {
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

    User.hasMany(models.PackageOrder, {
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

    User.hasMany(models.BinaryTree, {
      as: "userId",
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    User.hasMany(models.BinaryTree, {
      as: "parentId",
      foreignKey: {
        name: "parentId",
        allowNull: true,
        defaultValue: null,
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasOne(models.UserBinaryRank, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasMany(models.CommissionHistory, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    User.hasOne(models.CommissionCalculator, {
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return User;
};
