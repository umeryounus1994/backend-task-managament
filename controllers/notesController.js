const { Note, NoteVersion, NoteShare } = require('../models');
const { validationResult } = require('express-validator');
const { getCache, setCache, deleteCache, deleteCachePattern } = require('../utils/cache');
const { sequelize } = require('../config/database');
const { Op } = require('sequelize');

/**
 * Create a new note
 * @route POST /api/notes
 * @access Private
 */
const createNote = async (req, res, next) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, content } = req.body;
    const userId = req.user.id;

    // Create note with initial version 1
    const note = await Note.create({
      userId,
      title,
      content: content || '',
      version: 1
    });

    // Create initial version snapshot
    await NoteVersion.create({
      noteId: note.id,
      title: note.title,
      content: note.content,
      version: 1
    });

    // Invalidate cache for user's notes list
    await deleteCachePattern(`notes:user:${userId}*`);

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: {
        note: {
          id: note.id,
          userId: note.userId,
          title: note.title,
          content: note.content,
          version: note.version,
          isDeleted: note.isDeleted,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all notes for the authenticated user
 * @route GET /api/notes
 * @access Private
 */
const getAllNotes = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const cacheKey = `notes:user:${userId}`;

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: 'Notes retrieved successfully (cached)',
        data: cachedData
      });
    }

    // Get notes owned by the user
    const ownedNotes = await Note.findAll({
      where: {
        userId,
        isDeleted: false
      },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'userId', 'title', 'content', 'version', 'createdAt', 'updatedAt'],
      raw: true
    });

    // Get notes shared with the user
    const sharedNoteShares = await NoteShare.findAll({
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
          attributes: ['id', 'userId', 'title', 'content', 'version', 'createdAt', 'updatedAt'],
          required: true
        }
      ]
    });

    // Extract shared notes and add permission info
    const sharedNotes = sharedNoteShares.map(share => {
      const note = share.note.get ? share.note.get({ plain: true }) : share.note;
      return {
        ...note,
        isShared: true,
        sharePermission: share.permission,
        shareId: share.id
      };
    });

    // Mark owned notes
    const ownedNotesWithFlag = ownedNotes.map(note => ({
      ...note,
      isShared: false
    }));

    // Combine and sort by updatedAt
    const allNotes = [...ownedNotesWithFlag, ...sharedNotes].sort((a, b) => {
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });

    const responseData = {
      notes: allNotes,
      count: allNotes.length,
      ownedCount: ownedNotes.length,
      sharedCount: sharedNotes.length
    };

    // Cache the result for 1 hour
    await setCache(cacheKey, responseData, 3600);

    res.json({
      success: true,
      message: 'Notes retrieved successfully',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single note by ID
 * @route GET /api/notes/:id
 * @access Private
 */
const getNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const cacheKey = `note:${id}:user:${userId}`;

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: 'Note retrieved successfully (cached)',
        data: cachedData
      });
    }

    // Find the note
    const note = await Note.findOne({
      where: {
        id,
        isDeleted: false
      },
      attributes: ['id', 'userId', 'title', 'content', 'version', 'createdAt', 'updatedAt']
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if user owns the note
    const isOwner = note.userId === userId;

    // If not owner, check if note is shared with user
    if (!isOwner) {
      const share = await NoteShare.findOne({
        where: {
          noteId: id,
          sharedWithUserId: userId
        }
      });

      if (!share) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this note'
        });
      }

      // Note is shared, add permission info to response
      const noteData = note.get ? note.get({ plain: true }) : note;
      const responseData = {
        note: {
          ...noteData,
          isShared: true,
          sharePermission: share.permission
        }
      };

      // Cache the result for 1 hour
      await setCache(cacheKey, responseData, 3600);

      return res.json({
        success: true,
        message: 'Note retrieved successfully',
        data: responseData
      });
    }

    // User owns the note
    const responseData = {
      note: {
        ...(note.get ? note.get({ plain: true }) : note),
        isShared: false
      }
    };

    // Cache the result for 1 hour
    await setCache(cacheKey, responseData, 3600);

    res.json({
      success: true,
      message: 'Note retrieved successfully',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a note with concurrency handling
 * @route PUT /api/notes/:id
 * @access Private
 */
const updateNote = async (req, res, next) => {
  try {
    // Check for validation errors
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
    const { title, content, version } = req.body;

    // Find the note - check if owned by user
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

    // Check if user owns the note
    const isOwner = note.userId === userId;

    // If not owner, check if note is shared with user and has edit permission
    if (!isOwner) {
      const share = await NoteShare.findOne({
        where: {
          noteId: id,
          sharedWithUserId: userId
        }
      });

      if (!share) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this note'
        });
      }

      if (share.permission === 'read') {
        return res.status(403).json({
          success: false,
          message: 'This note is view-only. You do not have permission to edit it.'
        });
      }

      // Permission is 'edit', allow update to proceed
    }

    // Optimistic locking: Check if version matches
    // This prevents lost updates by ensuring the version hasn't changed
    if (version !== undefined && note.version !== version) {
      return res.status(409).json({
        success: false,
        message: 'Note has been modified by another user. Please refresh and try again.',
        data: {
          currentVersion: note.version,
          providedVersion: version
        }
      });
    }

    // Prepare update data
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;

    // Increment version
    const newVersion = note.version + 1;
    updateData.version = newVersion;

    // Atomic update with version check to prevent race conditions
    // This ensures that if another user updated the note between our read and update,
    // the update will fail because the version won't match
    const [affectedRows] = await Note.update(updateData, {
      where: {
        id: id,
        version: note.version, // Only update if version hasn't changed
        isDeleted: false
      }
    });

    // If no rows were affected, it means the version changed (concurrent update)
    if (affectedRows === 0) {
      // Fetch the current note state to get the latest version
      const currentNote = await Note.findByPk(id);
      return res.status(409).json({
        success: false,
        message: 'Note has been modified by another user. Please refresh and try again.',
        data: {
          currentVersion: currentNote ? currentNote.version : note.version,
          providedVersion: version
        }
      });
    }

    // Reload the note to get updated data
    await note.reload();

    // Create a new version snapshot
    await NoteVersion.create({
      noteId: note.id,
      title: note.title,
      content: note.content,
      version: note.version
    });

    // Invalidate cache for this note and user's notes list
    await deleteCache(`note:${id}:user:${userId}`);
    await deleteCachePattern(`notes:user:${userId}*`);

    res.json({
      success: true,
      message: 'Note updated successfully',
      data: {
        note: {
          id: note.id,
          userId: note.userId,
          title: note.title,
          content: note.content,
          version: note.version,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Soft delete a note
 * @route DELETE /api/notes/:id
 * @access Private
 */
const deleteNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the note
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

    // Only the owner can delete notes
    if (note.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the note owner can delete this note'
      });
    }

    // Soft delete the note
    await note.softDelete();

    // Invalidate cache for this note and user's notes list
    await deleteCache(`note:${id}:user:${userId}`);
    await deleteCachePattern(`notes:user:${userId}*`);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all versions of a note
 * @route GET /api/notes/:id/versions
 * @access Private
 */
const getNoteVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the note
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

    // Check if user owns the note
    const isOwner = note.userId === userId;

    // If not owner, check if note is shared with user (read or edit permission)
    if (!isOwner) {
      const share = await NoteShare.findOne({
        where: {
          noteId: id,
          sharedWithUserId: userId
        }
      });

      if (!share) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this note'
        });
      }
      // Shared users with read or edit permission can view versions
    }

    // Get all versions for this note
    const versions = await NoteVersion.findAll({
      where: {
        noteId: id
      },
      order: [['version', 'DESC']],
      attributes: ['id', 'noteId', 'title', 'content', 'version', 'createdAt']
    });

    res.json({
      success: true,
      message: 'Note versions retrieved successfully',
      data: {
        noteId: parseInt(id),
        versions,
        count: versions.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Revert a note to a specific version
 * @route POST /api/notes/:id/revert/:versionId
 * @access Private
 */
const revertNote = async (req, res, next) => {
  try {
    const { id, versionId } = req.params;
    const userId = req.user.id;

    // Find the note
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

    // Check if user owns the note
    const isOwner = note.userId === userId;

    // If not owner, check if note is shared with user and has edit permission
    if (!isOwner) {
      const share = await NoteShare.findOne({
        where: {
          noteId: id,
          sharedWithUserId: userId
        }
      });

      if (!share) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to revert this note'
        });
      }

      if (share.permission === 'read') {
        return res.status(403).json({
          success: false,
          message: 'This note is view-only. You do not have permission to revert it.'
        });
      }

      // Permission is 'edit', allow revert to proceed
    }

    // Find the version to revert to
    const versionToRevert = await NoteVersion.findOne({
      where: {
        id: versionId,
        noteId: id
      }
    });

    if (!versionToRevert) {
      return res.status(404).json({
        success: false,
        message: 'Version not found'
      });
    }

    // Update note with version data
    const newVersion = note.version + 1;
    await note.update({
      title: versionToRevert.title,
      content: versionToRevert.content,
      version: newVersion
    });

    // Create a new version snapshot from the reverted state
    await NoteVersion.create({
      noteId: note.id,
      title: versionToRevert.title,
      content: versionToRevert.content,
      version: newVersion
    });

    // Reload to get updated data
    await note.reload();

    // Invalidate cache for this note and user's notes list
    await deleteCache(`note:${id}:user:${userId}`);
    await deleteCachePattern(`notes:user:${userId}*`);

    res.json({
      success: true,
      message: 'Note reverted successfully',
      data: {
        note: {
          id: note.id,
          userId: note.userId,
          title: note.title,
          content: note.content,
          version: note.version,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt
        },
        revertedFromVersion: versionToRevert.version,
        newVersion: note.version
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Search notes using full-text search
 * @route GET /api/notes/search
 * @access Private
 */
const searchNotes = async (req, res, next) => {
  try {
    const { keywords } = req.query;
    const userId = req.user.id;

    if (!keywords || keywords.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Keywords parameter is required'
      });
    }

    // Build cache key
    const trimmedKeywords = keywords.trim();
    const cacheKey = `notes:search:user:${userId}:keywords:${trimmedKeywords.toLowerCase()}`;

    // Try to get from cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      return res.json({
        success: true,
        message: 'Notes found (cached)',
        data: cachedData
      });
    }

    // Use Sequelize LIKE search for reliable case-insensitive partial matching
    // This works for all keyword lengths and is more reliable than raw SQL
    const searchTerm = trimmedKeywords;
    const searchPattern = `%${searchTerm}%`;
    
    // Debug: Log search parameters
    if (process.env.NODE_ENV === 'development') {
      console.log('Search params:', { userId, searchTerm, searchPattern });
    }
    
    const notes = await Note.findAll({
      where: {
        userId,
        isDeleted: false,
        [Op.or]: [
          {
            title: {
              [Op.like]: searchPattern
            }
          },
          {
            content: {
              [Op.like]: searchPattern
            }
          }
        ]
      },
      attributes: ['id', 'userId', 'title', 'content', 'version', 'createdAt', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      raw: true // Return plain objects instead of Sequelize instances
    });
    
    // Debug: Log results
    if (process.env.NODE_ENV === 'development') {
      console.log('Search results count:', notes ? notes.length : 0);
    }

    const responseData = {
      notes: notes || [],
      count: notes ? notes.length : 0,
      keywords: trimmedKeywords
    };

    // Cache the result for 30 minutes (shorter than regular cache since search results may change)
    // Only cache if we have results (avoid caching empty searches)
    if (notes.length > 0) {
      await setCache(cacheKey, responseData, 1800);
    }

    res.json({
      success: true,
      message: notes.length > 0 ? 'Notes found' : 'No notes found matching your search',
      data: responseData
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNote,
  getAllNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getNoteVersions,
  revertNote,
  searchNotes
};

