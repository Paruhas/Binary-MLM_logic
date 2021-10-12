module.exports = (sequelize, DataTypes) => {
  const InvitedHistory = sequelize.define(
    "InvitedHistory",
    {},
    {
      underscored: true,
      timestamps: true,
    }
  );

  InvitedHistory.associate = (models) => {
    InvitedHistory.belongsTo(models.User, {
      foreignKey: {
        name: "userInviteSend",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });

    InvitedHistory.belongsTo(models.User, {
      foreignKey: {
        name: "userInvited",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return InvitedHistory;
};
