const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NoteVersion = sequelize.define('NoteVersion', {
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
    comment: 'Version number of this snapshot'
  }
}, {
  tableName: 'note_versions',
  timestamps: true,
  updatedAt: false,
  indexes: [
    {
      fields: ['noteId']
    },
    {
      fields: ['noteId', 'version']
    }
  ]
});

module.exports = NoteVersion;

