const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
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
 *     security: [{ bearerAuth: [] }]
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
 *       200: { $ref: '#/components/responses/Success' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get(
  '/shared',
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
  noteShareController.getSharedNotes
);

/**
 * @swagger
 * /api/notes/{id}/share:
 *   post:
 *     summary: Share a note with another user
 *     tags: [Note Sharing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         'application/json': { schema: { $ref: '#/components/schemas/ShareNoteRequest' } }
 *     responses:
 *       201: { $ref: '#/components/responses/Created' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
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
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         'application/json': { schema: { $ref: '#/components/schemas/UpdateShareRequest' } }
 *     responses:
 *       200: { $ref: '#/components/responses/Success' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
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
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: shareId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { $ref: '#/components/responses/Success' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
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

