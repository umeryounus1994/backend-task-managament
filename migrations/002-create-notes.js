'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
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
        allowNull: false,
        defaultValue: 1
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      deletedAt: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex('notes', ['userId'], {
      name: 'notes_userId_idx'
    });

    await queryInterface.addIndex('notes', ['isDeleted'], {
      name: 'notes_isDeleted_idx'
    });

    await queryInterface.addIndex('notes', ['userId', 'isDeleted'], {
      name: 'notes_userId_isDeleted_idx'
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE notes ADD FULLTEXT INDEX notes_fulltext_idx (title, content)
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('notes');
  }
};

