module.exports = (sequelize, DataTypes) => {
  const BinaryTree = sequelize.define(
    "BinaryTree",
    {
      // parentId: {
      //   type: DataTypes.STRING,
      //   allowNull: true,
      //   defaultValue: null,
      // },
      position: {
        type: DataTypes.ENUM("L", "R"),
        allowNull: true,
        defaultValue: null,
      },
      placeByUserId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      underscored: true,
      timestamps: true,
    }
  );

  BinaryTree.associate = (models) => {
    BinaryTree.belongsTo(models.User, {
      as: "userData",
      foreignKey: {
        name: "userId",
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
    BinaryTree.belongsTo(models.User, {
      as: "childId",
      foreignKey: {
        name: "parentId",
        allowNull: true,
        defaultValue: null,
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return BinaryTree;
};
