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
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNoteRequest'
 *           example:
 *             title: My First Note
 *             content: This is the content of my note
 *     responses:
 *       201:
 *         description: Note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *       401:
 *         description: Unauthorized
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
 *     responses:
 *       200:
 *         description: Notes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notes retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/',
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
 *         description: Search keywords
 *         example: JavaScript tutorial
 *     responses:
 *       200:
 *         description: Notes found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notes found
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Note'
 *                     count:
 *                       type: integer
 *                       example: 3
 *                     keywords:
 *                       type: string
 *                       example: JavaScript tutorial
 *       400:
 *         description: Keywords parameter is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Keywords parameter is required
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/search',
  [
    query('keywords')
      .notEmpty()
      .withMessage('Keywords parameter is required')
      .trim()
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
 *         description: Note ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Note retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Note not found
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
 *     description: Updates a note with optimistic locking. Requires the current version number to prevent concurrent modification conflicts.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Note ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNoteRequest'
 *           example:
 *             title: Updated Note Title
 *             content: Updated content
 *             version: 1
 *     responses:
 *       200:
 *         description: Note updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: array
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Note not found
 *       409:
 *         description: Conflict - Note has been modified by another user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Note has been modified by another user. Please refresh and try again.
 *                 data:
 *                   type: object
 *                   properties:
 *                     currentVersion:
 *                       type: integer
 *                       example: 2
 *                     providedVersion:
 *                       type: integer
 *                       example: 1
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
 *         description: Note ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Note deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Note not found
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
 *         description: Note ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Note versions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note versions retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     noteId:
 *                       type: integer
 *                       example: 1
 *                     versions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           noteId:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           content:
 *                             type: string
 *                           version:
 *                             type: integer
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     count:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Note not found
 */
router.get(
  '/:id/versions',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer')
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
 *         description: Note ID
 *         example: 1
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Version ID to revert to
 *         example: 3
 *     responses:
 *       200:
 *         description: Note reverted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Note reverted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     note:
 *                       $ref: '#/components/schemas/Note'
 *                     revertedFromVersion:
 *                       type: integer
 *                       example: 2
 *                     newVersion:
 *                       type: integer
 *                       example: 4
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or version not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Note not found
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

