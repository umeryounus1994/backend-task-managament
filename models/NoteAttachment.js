const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NoteAttachment = sequelize.define('NoteAttachment', {
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
  fileType: {
    type: DataTypes.ENUM('image', 'video', 'pdf', 'other'),
    allowNull: false
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  fileSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'File size in bytes'
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: true
  }
}, {
  tableName: 'note_attachments',
  timestamps: true,
  indexes: [
    {
      fields: ['noteId']
    },
    {
      fields: ['fileType']
    }
  ]
});

module.exports = NoteAttachment;

