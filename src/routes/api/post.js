const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {

    // Authentication
    if (!req.user) {
      logger.warn('POST /fragments: unauthenticated request');
      return res.status(401).json({ status: 'error', error: 'Authentication required' });
    }

    // Content-Type header
    const ctHeader = req.headers['content-type'];
    if (!ctHeader) {
      logger.warn('POST /fragments: missing Content-Type header');
      return res.status(400).json({ status: 'error', error: 'Content-Type header is required' });
    }

    let type;
    try {
      ({ type } = contentType.parse(ctHeader)); // parse header string
    } catch (err) {
      logger.error(`POST /fragments: invalid Content-Type header - ${err.message}`);
      return res.status(400).json({ status: 'error', error: 'Invalid Content-Type' });
    }

    // Unsupported type
    if (!Fragment.isSupportedType(type)) {
      logger.warn(`POST /fragments: unsupported content type=${type}`);
      return res.status(415).json({ status: 'error', error: `Unsupported content type: ${type}` });
    }

    // Body must be a Buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('POST /fragments: request body is not a Buffer');
      return res.status(400).json({ status: 'error', error: 'Request body must be binary data' });
    }

    // Create fragment
    const fragment = new Fragment({ ownerId: req.user, type });
    await fragment.setData(req.body);
    await fragment.save();

    // Location header
    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, baseUrl).toString();
    res.set('Location', location);

    logger.info(`POST /fragments: fragment created id=${fragment.id}`);
    res.status(201).json({ status: 'ok', fragment });
  } catch (err) {
    logger.error(`POST /fragments failed: ${err.stack}`);
    res.status(500).json({ status: 'error', error: 'Internal server error' });
  }
};
