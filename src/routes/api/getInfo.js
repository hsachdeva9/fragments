// src/routes/api/getInfo.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get fragment metadata by ID
 */
module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // Get fragment metadata (throws if not found or unauthorized)
    const fragment = await Fragment.byId(req.user, id);

    // Return just the metadata (NOT the data)
    res.status(200).json(
      createSuccessResponse({
        fragment: fragment,
      })
    );
    
  } catch (err) {
    // Handle not found errors
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    
    // Log and handle unexpected errors
    logger.error({ err }, 'Error fetching fragment info');
    res.status(500).json(createErrorResponse(500, 'Unable to retrieve fragment info'));
  }
};
