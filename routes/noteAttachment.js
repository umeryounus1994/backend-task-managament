const express = require('express');
const router = express.Router();
const { param, query } = require('express-validator');
const noteAttachmentController = require('../controllers/noteAttachmentController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/notes/{id}/attachments:
 *   post:
 *     summary: Upload an attachment to a note
 *     tags: [Note Attachments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201: { $ref: '#/components/responses/Created' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.post(
  '/:id/attachments',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer')
  ],
  upload.single('file'),
  noteAttachmentController.uploadAttachment
);

/**
 * @swagger
 * /api/notes/{id}/attachments:
 *   get:
 *     summary: Get all attachments for a note
 *     tags: [Note Attachments]
 *     security: [{ bearerAuth: [] }]
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
 *       200: { $ref: '#/components/responses/Success' }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get(
  '/:id/attachments',
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
  noteAttachmentController.getAttachments
);

/**
 * @swagger
 * /api/notes/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Note Attachments]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200: { $ref: '#/components/responses/Success' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.delete(
  '/:id/attachments/:attachmentId',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer'),
    param('attachmentId')
      .isInt({ min: 1 })
      .withMessage('Attachment ID must be a positive integer')
  ],
  noteAttachmentController.deleteAttachment
);

module.exports = router;

