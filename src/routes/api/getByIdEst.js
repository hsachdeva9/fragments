// src/routes/api/getByIdEst.js

const { Fragment } = require('../../model/fragment');
const { createErrorResponse } = require('../../response');
const logger = require('../../logger');

/**
 * Get a fragment by ID with conversion
 * Route: GET /v1/fragments/:id.:ext
 */
module.exports = async (req, res) => {
  try {
    // With route pattern /:id.:ext, Express gives us:
    // req.params.id = "abc123"
    // req.params.ext = "html" (without the dot)
    
    const { id, ext } = req.params;
    const extension = `.${ext}`; // Add the dot: "html" -> ".html"

    logger.debug({ id, ext: extension }, 'Converting fragment');

    // Validate extension
    if (!Fragment.isValidExtension(extension)) {
      return res.status(415).json(
        createErrorResponse(415, `Unsupported file extension: ${extension}`)
      );
    }

    // Get target MIME type from extension
    const targetType = Fragment.mimeTypeForExtension(extension);
    
    if (!targetType) {
      return res.status(415).json(
        createErrorResponse(415, `Cannot determine type for extension: ${extension}`)
      );
    }

    // Get the fragment
    const fragment = await Fragment.byId(req.user, id);

    // Check if conversion is supported
    if (!fragment.formats.includes(targetType)) {
      return res.status(415).json(
        createErrorResponse(
          415,
          `Cannot convert from ${fragment.type} to ${targetType}`
        )
      );
    }

    // Get fragment data
    const data = await fragment.getData();

    // Convert if needed
    const convertedData = await fragment.convertData(data, targetType);

    // Return converted data with correct Content-Type
    res.status(200).type(targetType).send(convertedData);
    
  } catch (err) {
    logger.error({ err }, 'Error converting fragment');

    // Handle not found errors
    if (err.message && (err.message.includes('not found') || err.message.includes('unknown fragment'))) {
      return res.status(404).json(createErrorResponse(404, 'Fragment not found'));
    }

    // Handle conversion errors
    if (err.message && err.message.includes('not supported')) {
      return res.status(415).json(createErrorResponse(415, err.message));
    }

    // Unexpected errors
    res.status(500).json(createErrorResponse(500, 'Unable to convert fragment'));
  }
};
