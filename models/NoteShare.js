const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NoteShare = sequelize.define('NoteShare', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  noteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'notes',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  sharedWithUserId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  permission: {
    type: DataTypes.ENUM('read', 'edit'),
    allowNull: false,
    defaultValue: 'read'
  }
}, {
  tableName: 'note_shares',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['noteId', 'sharedWithUserId'],
      name: 'unique_note_share'
    },
    {
      fields: ['noteId']
    },
    {
      fields: ['sharedWithUserId']
    }
  ]
});

module.exports = NoteShare;

