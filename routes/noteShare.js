const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const noteShareController = require('../controllers/noteShareController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/notes/shared:
 *   get:
 *     summary: Get all notes shared with the authenticated user
 *     tags: [Note Sharing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Shared notes retrieved successfully
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
 *                   example: Shared notes retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     notes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           note:
 *                             $ref: '#/components/schemas/Note'
 *                           permission:
 *                             type: string
 *                             enum: [read, edit]
 *                           sharedAt:
 *                             type: string
 *                             format: date-time
 *                           sharedBy:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: integer
 *                               email:
 *                                 type: string
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/shared',
  noteShareController.getSharedNotes
);

/**
 * @swagger
 * /api/notes/{id}/share:
 *   post:
 *     summary: Share a note with another user
 *     tags: [Note Sharing]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ShareNoteRequest'
 *           example:
 *             sharedWithUserId: 2
 *             permission: read
 *     responses:
 *       201:
 *         description: Note shared successfully
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
 *                   example: Note shared successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     share:
 *                       $ref: '#/components/schemas/NoteShare'
 *                     sharedWith:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         email:
 *                           type: string
 *       400:
 *         description: Validation error or cannot share with yourself
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or user not found
 *       409:
 *         description: Note already shared with this user
 */
router.post(
  '/:id/share',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    body('sharedWithUserId')
      .isInt({ min: 1 })
      .withMessage('sharedWithUserId must be a positive integer'),
    body('permission')
      .isIn(['read', 'edit'])
      .withMessage('Permission must be either "read" or "edit"')
  ],
  noteShareController.shareNote
);

/**
 * @swagger
 * /api/notes/{id}/share/{shareId}:
 *   put:
 *     summary: Update share permission
 *     tags: [Note Sharing]
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
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Share ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateShareRequest'
 *           example:
 *             permission: edit
 *     responses:
 *       200:
 *         description: Share permission updated successfully
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
 *                   example: Share permission updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     share:
 *                       $ref: '#/components/schemas/NoteShare'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or share not found
 */
router.put(
  '/:id/share/:shareId',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    param('shareId')
      .isInt({ min: 1 })
      .withMessage('Share ID must be a positive integer'),
    body('permission')
      .isIn(['read', 'edit'])
      .withMessage('Permission must be either "read" or "edit"')
  ],
  noteShareController.updateSharePermission
);

/**
 * @swagger
 * /api/notes/{id}/share/{shareId}:
 *   delete:
 *     summary: Unshare a note
 *     tags: [Note Sharing]
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
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Share ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Note unshared successfully
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
 *                   example: Note unshared successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or share not found
 */
router.delete(
  '/:id/share/:shareId',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    param('shareId')
      .isInt({ min: 1 })
      .withMessage('Share ID must be a positive integer')
  ],
  noteShareController.unshareNote
);

module.exports = router;

