const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const notesController = require('../controllers/notesController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/notes:
 *   post:
 *     summary: Create a new note
 *     tags: [Notes]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       content:
 *         'application/json': { schema: { $ref: '#/components/schemas/CreateNoteRequest' } }
 *     responses:
 *       201: { $ref: '#/components/responses/Created' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 500 })
      .withMessage('Title must be at most 500 characters'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string')
  ],
  notesController.createNote
);

/**
 * @swagger
 * /api/notes:
 *   get:
 *     summary: Get all notes for the authenticated user
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  notesController.getAllNotes
);

/**
 * @swagger
 * /api/notes/search:
 *   get:
 *     summary: Search notes using full-text search
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/search',
  [
    query('keywords')
      .notEmpty()
      .withMessage('Keywords parameter is required')
      .trim(),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  notesController.searchNotes
);

/**
 * @swagger
 * /api/notes/{id}:
 *   get:
 *     summary: Get a single note by ID
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer')
  ],
  notesController.getNoteById
);

/**
 * @swagger
 * /api/notes/{id}:
 *   put:
 *     summary: Update a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     description: Updates a note with optimistic locking. Requires the current version number.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteRequest'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 */
router.put(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    body('version')
      .isInt({ min: 1 })
      .withMessage('Version is required and must be a positive integer'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Title cannot be empty')
      .isLength({ max: 500 })
      .withMessage('Title must be at most 500 characters'),
    body('content')
      .optional()
      .isString()
      .withMessage('Content must be a string')
  ],
  notesController.updateNote
);

/**
 * @swagger
 * /api/notes/{id}:
 *   delete:
 *     summary: Soft delete a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     description: Soft deletes a note (marks as deleted but preserves data and version history)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:id',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer')
  ],
  notesController.deleteNote
);

/**
 * @swagger
 * /api/notes/{id}/versions:
 *   get:
 *     summary: Get all versions of a note
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/:id/versions',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  notesController.getNoteVersions
);

/**
 * @swagger
 * /api/notes/{id}/revert/{versionId}:
 *   post:
 *     summary: Revert a note to a specific version
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     description: Reverts a note to a previous version by creating a new version from the selected version snapshot
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/Success'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/:id/revert/:versionId',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    param('versionId')
      .isInt({ min: 1 })
      .withMessage('Version ID must be a positive integer')
  ],
  notesController.revertNote
);

module.exports = router;

