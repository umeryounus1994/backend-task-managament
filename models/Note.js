const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  title: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Current version number for optimistic locking'
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'notes',
  timestamps: true,
  paranoid: false,
  defaultScope: {
    where: {
      isDeleted: false
    }
  },
  scopes: {
    withDeleted: {
      where: {}
    },
    deleted: {
      where: {
        isDeleted: true
      }
    }
  },
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isDeleted']
    },
    {
      fields: ['userId', 'isDeleted']
    },
    {
      type: 'FULLTEXT',
      fields: ['title', 'content'],
      name: 'notes_fulltext_idx'
    }
  ]
});

// Instance method to soft delete
Note.prototype.softDelete = async function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

// Instance method to restore
Note.prototype.restore = async function() {
  this.isDeleted = false;
  this.deletedAt = null;
  return await this.save();
};

// Class method to find active notes for a user
Note.findActiveByUser = async function(userId) {
  return await this.findAll({
    where: {
      userId,
      isDeleted: false
    },
    order: [['updatedAt', 'DESC']]
  });
};

module.exports = Note;

