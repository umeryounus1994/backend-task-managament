const { Note, NoteAttachment } = require('../models');
const { validationResult } = require('express-validator');
const path = require('path');
const fs = require('fs');
const { deleteCache, deleteCachePattern } = require('../utils/cache');

/**
 * Determine file type from mime type
 */
const getFileType = (mimeType) => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'other';
};

/**
 * Upload attachment to a note
 * @route POST /api/notes/:id/attachments
 * @access Private
 */
const uploadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Verify note exists and belongs to user
    const note = await Note.findOne({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });

    if (!note) {
      // Delete uploaded file if note not found
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Determine file type
    const fileType = getFileType(req.file.mimetype);

    // Create attachment record
    const attachment = await NoteAttachment.create({
      noteId: id,
      fileType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Invalidate cache
    await deleteCache(`note:${id}:user:${userId}`);
    await deleteCachePattern(`notes:user:${userId}*`);

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully',
      data: {
        attachment: {
          id: attachment.id,
          noteId: attachment.noteId,
          fileType: attachment.fileType,
          fileName: attachment.fileName,
          filePath: attachment.filePath,
          fileSize: attachment.fileSize,
          mimeType: attachment.mimeType,
          createdAt: attachment.createdAt
        }
      }
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting file:', unlinkError);
      }
    }
    next(error);
  }
};

/**
 * Get all attachments for a note
 * @route GET /api/notes/:id/attachments
 * @access Private
 */
const getAttachments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify note exists and belongs to user (or is shared with user)
    const note = await Note.findOne({
      where: {
        id,
        isDeleted: false
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user owns the note or has access via sharing
    const { NoteShare } = require('../models');
    const isOwner = note.userId === userId;
    const hasAccess = await NoteShare.findOne({
      where: {
        noteId: id,
        sharedWithUserId: userId
      }
    });

    if (!isOwner && !hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this note'
      });
    }

    // Get all attachments
    const attachments = await NoteAttachment.findAll({
      where: {
        noteId: id
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'noteId', 'fileType', 'fileName', 'filePath', 'fileSize', 'mimeType', 'createdAt']
    });

    res.json({
      success: true,
      message: 'Attachments retrieved successfully',
      data: {
        noteId: parseInt(id),
        attachments,
        count: attachments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an attachment
 * @route DELETE /api/notes/:id/attachments/:attachmentId
 * @access Private
 */
const deleteAttachment = async (req, res, next) => {
  try {
    const { id, attachmentId } = req.params;
    const userId = req.user.id;

    // Verify note exists and belongs to user
    const note = await Note.findOne({
      where: {
        id,
        userId,
        isDeleted: false
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Find the attachment
    const attachment = await NoteAttachment.findOne({
      where: {
        id: attachmentId,
        noteId: id
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        message: 'Attachment not found'
      });
    }

    // Delete file from filesystem
    if (fs.existsSync(attachment.filePath)) {
      try {
        fs.unlinkSync(attachment.filePath);
      } catch (error) {
        console.error('Error deleting file:', error);
      }
    }

    // Delete attachment record
    await attachment.destroy();

    // Invalidate cache
    await deleteCache(`note:${id}:user:${userId}`);
    await deleteCachePattern(`notes:user:${userId}*`);

    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAttachment,
  getAttachments,
  deleteAttachment
};

