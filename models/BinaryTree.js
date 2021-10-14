module.exports = (sequelize, DataTypes) => {
  const BinaryTree = sequelize.define(
    "BinaryTree",
    {
      parentId: {
        type: DataTypes.STRING,
        // allowNull: false,
        allowNull: true,
        defaultValue: null,
      },
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
      foreignKey: {
        name: "userId",
        // allowNull: true,
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return BinaryTree;
};
