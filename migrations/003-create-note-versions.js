'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('note_versions', {
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
      title: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('note_versions', ['noteId'], {
      name: 'note_versions_noteId_idx'
    });

    await queryInterface.addIndex('note_versions', ['noteId', 'version'], {
      name: 'note_versions_noteId_version_idx'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('note_versions');
  }
};

