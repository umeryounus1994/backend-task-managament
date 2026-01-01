const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: File to upload (images, videos, PDFs)
 *     responses:
 *       201:
 *         description: Attachment uploaded successfully
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
 *                   example: Attachment uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     attachment:
 *                       $ref: '#/components/schemas/NoteAttachment'
 *       400:
 *         description: No file uploaded or invalid file type
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note not found
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
 *         description: Attachments retrieved successfully
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
 *                   example: Attachments retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     noteId:
 *                       type: integer
 *                     attachments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NoteAttachment'
 *                     count:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 *       404:
 *         description: Note not found
 */
router.get(
  '/:id/attachments',
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('Note ID must be a positive integer')
  ],
  noteAttachmentController.getAttachments
);

/**
 * @swagger
 * /api/notes/{id}/attachments/{attachmentId}:
 *   delete:
 *     summary: Delete an attachment
 *     tags: [Note Attachments]
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
 *         name: attachmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Attachment ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Attachment deleted successfully
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
 *                   example: Attachment deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Note or attachment not found
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

