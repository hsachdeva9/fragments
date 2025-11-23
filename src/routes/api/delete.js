// src/routes/api/delete.js

const { createSuccessResponse, createErrorResponse } = require('../../response');
const { Fragment } = require('../../model/fragment');
const logger = require('../../logger');

/**
 * Delete a fragment by id for the authenticated user
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user;

    logger.debug({ id, ownerId }, 'Attempting to delete fragment');

    // Try to get the fragment first to verify it exists and belongs to this user
    await Fragment.byId(ownerId, id);

    // If we get here, the fragment exists. Now delete it.
    await Fragment.delete(ownerId, id);

    logger.info({ id, ownerId }, 'Fragment deleted successfully');

    // Return success response
    res.status(200).json(createSuccessResponse());
  } catch (err) {
    logger.error({ err, id: req.params.id }, 'Error deleting fragment');

    // If fragment wasn't found, return 404
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // For any other error, return 500
    res.status(500).json(createErrorResponse(500, 'Unable to delete fragment'));
  }
};
