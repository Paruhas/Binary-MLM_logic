module.exports = (sequelize, DataTypes) => {
  const BinaryTree = sequelize.define(
    "BinaryTree",
    {
      parentId: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      position: {
        type: DataTypes.ENUM("L", "R"),
        allowNull: true,
        defaultValue: null,
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
      },
      onUpdate: "RESTRICT",
      onDelete: "RESTRICT",
    });
  };

  return BinaryTree;
};
