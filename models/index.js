const { sequelize } = require('../config/database');

const User = require('./User');
const Note = require('./Note');
const NoteVersion = require('./NoteVersion');
const NoteShare = require('./NoteShare');
const NoteAttachment = require('./NoteAttachment');
const RefreshToken = require('./RefreshToken');

// Define associations
User.hasMany(Note, { foreignKey: 'userId', as: 'notes' });
Note.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Note.hasMany(NoteVersion, { foreignKey: 'noteId', as: 'versions' });
NoteVersion.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });

Note.hasMany(NoteShare, { foreignKey: 'noteId', as: 'shares' });
NoteShare.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });
NoteShare.belongsTo(User, { foreignKey: 'sharedWithUserId', as: 'sharedWithUser' });
User.hasMany(NoteShare, { foreignKey: 'sharedWithUserId', as: 'sharedNotes' });

Note.hasMany(NoteAttachment, { foreignKey: 'noteId', as: 'attachments' });
NoteAttachment.belongsTo(Note, { foreignKey: 'noteId', as: 'note' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

const models = {
  sequelize,
  Sequelize: require('sequelize'),
  User,
  Note,
  NoteVersion,
  NoteShare,
  NoteAttachment,
  RefreshToken
};

module.exports = models;
