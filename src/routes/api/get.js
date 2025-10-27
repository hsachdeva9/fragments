// src/routes/api/get.js

const { Fragment } = require('../../model/fragment');
const { createSuccessResponse, createErrorResponse } = require('../../response');

/**
 * Get a list of fragments for the current user
 * Supports `?expand=1` query param for detailed metadata
 */

module.exports = async (req, res) => {
  try {
    // Check if expand=1 is passed
    const expand = req.query.expand === '1';

    // Retrieve all fragments for this user
    const fragments = await Fragment.byUser(req.user, expand);

    res.status(200).json(
      createSuccessResponse({
        fragments,
      })
    );
  } catch (err) {
    console.error('Error fetching fragments:', err);
    res.status(500).json(
      createErrorResponse(500, 'Unable to retrieve fragments')
    );
  }
};
