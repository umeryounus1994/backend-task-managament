const { Note, NoteShare, User } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { getCache, setCache, deleteCache, deleteCachePattern } = require('../utils/cache');

/**
 * Share a note with another user
 * @route POST /api/notes/:id/share
 * @access Private
 */
const shareNote = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const { sharedWithUserId, permission } = req.body;

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

    // Cannot share with yourself
    if (sharedWithUserId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot share note with yourself'
      });
    }

    // Verify shared user exists
    const sharedUser = await User.findByPk(sharedWithUserId);
    if (!sharedUser) {
      return res.status(404).json({
        success: false,
        message: 'User to share with not found'
      });
    }

    // Check if already shared
    const existingShare = await NoteShare.findOne({
      where: {
        noteId: id,
        sharedWithUserId
      }
    });

    if (existingShare) {
      return res.status(409).json({
        success: false,
        message: 'Note is already shared with this user'
      });
    }

    // Create share
    const share = await NoteShare.create({
      noteId: id,
      sharedWithUserId,
      permission
    });

    // Invalidate cache for both users
    await deleteCachePattern(`notes:user:${userId}*`);
    await deleteCachePattern(`notes:user:${sharedWithUserId}*`);
    await deleteCache(`note:${id}:user:${userId}`);

    res.status(201).json({
      success: true,
      message: 'Note shared successfully',
      data: {
        share: {
          id: share.id,
          noteId: share.noteId,
          sharedWithUserId: share.sharedWithUserId,
          permission: share.permission,
          createdAt: share.createdAt
        },
        sharedWith: {
          id: sharedUser.id,
          email: sharedUser.email
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notes shared with the authenticated user
 * @route GET /api/notes/shared
 * @access Private
 */
const getSharedNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
      });
    }

    // Build cache key with pagination
    const cacheKey = `notes:shared:user:${userId}:page:${page}:limit:${limit}`;

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: 'Shared notes retrieved successfully (cached)',
        data: cachedData
      });
    }

    // Get total count
    const total = await NoteShare.count({
      where: {
        sharedWithUserId: userId
      },
      include: [
        {
          model: Note,
          as: 'note',
          where: {
            isDeleted: false
          },
          required: true
        }
      ]
    });

    // Get paginated notes shared with this user
    const shares = await NoteShare.findAll({
      where: {
        sharedWithUserId: userId
      },
      include: [
        {
          model: Note,
          as: 'note',
          where: {
            isDeleted: false
          },
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email']
            }
          ],
          attributes: ['id', 'userId', 'title', 'content', 'version', 'createdAt', 'updatedAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    const sharedNotes = shares.map(share => ({
      note: share.note,
      permission: share.permission,
      sharedAt: share.createdAt,
      sharedBy: share.note.user
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);

    const responseData = {
      notes: sharedNotes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    };

    // Cache for 1 hour
    await setCache(cacheKey, responseData, 3600);

    res.json({
      success: true,
      message: 'Shared notes retrieved successfully',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update share permission
 * @route PUT /api/notes/:id/share/:shareId
 * @access Private
 */
const updateSharePermission = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id, shareId } = req.params;
    const userId = req.user.id;
    const { permission } = req.body;

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

    // Find the share
    const share = await NoteShare.findOne({
      where: {
        id: shareId,
        noteId: id
      }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    // Update permission
    await share.update({ permission });

    // Invalidate cache for both users
    await deleteCachePattern(`notes:user:${userId}*`);
    await deleteCachePattern(`notes:shared:user:${share.sharedWithUserId}*`);
    await deleteCache(`note:${id}:user:${userId}`);

    res.json({
      success: true,
      message: 'Share permission updated successfully',
      data: {
        share: {
          id: share.id,
          noteId: share.noteId,
          sharedWithUserId: share.sharedWithUserId,
          permission: share.permission,
          updatedAt: share.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Unshare a note
 * @route DELETE /api/notes/:id/share/:shareId
 * @access Private
 */
const unshareNote = async (req, res, next) => {
  try {
    const { id, shareId } = req.params;
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

    // Find the share
    const share = await NoteShare.findOne({
      where: {
        id: shareId,
        noteId: id
      }
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: 'Share not found'
      });
    }

    const sharedWithUserId = share.sharedWithUserId;

    // Delete the share
    await share.destroy();

    // Invalidate cache for both users
    await deleteCachePattern(`notes:user:${userId}*`);
    await deleteCachePattern(`notes:shared:user:${sharedWithUserId}*`);
    await deleteCache(`note:${id}:user:${userId}`);

    res.json({
      success: true,
      message: 'Note unshared successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  shareNote,
  getSharedNotes,
  updateSharePermission,
  unshareNote
};

