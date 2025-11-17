// src/routes/api/getById.js 

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    const { id } = req.params;

    // This will throw an error if fragment doesn't exist or user doesn't own it
    const fragment = await Fragment.byId(req.user, id);
    
    // Get the actual fragment data
    const data = await fragment.getData();

    // For text types and JSON, always add charset=utf-8
    let contentType = fragment.type;
    const needsCharset = fragment.isText || fragment.mimeType === 'application/json';
    if (needsCharset && !contentType.includes('charset')) {
      contentType = `${contentType}; charset=utf-8`;
    }

    // Set Content-Type and return raw data
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', data.length);
    res.status(200).end(data);
    
  } catch (err) {
    // Check if it's a "not found" error
    if (err.message && err.message.includes('not found')) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    
    // Check if it's an "unknown fragment" error
    if (err.message && err.message.includes('unknown fragment')) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }
    
    // Log unexpected errors
    logger.error({ err }, 'Error fetching fragment by ID');
    res.status(500).json(createErrorResponse(500, 'Unable to retrieve fragment'));
  }
};
