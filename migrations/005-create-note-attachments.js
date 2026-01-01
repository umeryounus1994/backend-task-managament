'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('note_attachments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      noteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'notes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      fileType: {
        type: Sequelize.ENUM('image', 'video', 'pdf', 'other'),
        allowNull: false
      },
      fileName: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      filePath: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      fileSize: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      mimeType: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('note_attachments', ['noteId'], {
      name: 'note_attachments_noteId_idx'
    });

    await queryInterface.addIndex('note_attachments', ['fileType'], {
      name: 'note_attachments_fileType_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('note_attachments');
  }
};

