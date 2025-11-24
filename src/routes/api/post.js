const { Fragment } = require('../../model/fragment');
const contentType = require('content-type');
const logger = require('../../logger');

module.exports = async (req, res) => {
  try {
    // ADD THESE DEBUG LOGS
    logger.info('========== POST /v1/fragments START ==========');
    logger.info(`User: ${req.user}`);
    logger.info(`Content-Type: ${req.headers['content-type']}`);
    logger.info(`Body type: ${typeof req.body}`);
    logger.info(`Is Buffer: ${Buffer.isBuffer(req.body)}`);
    logger.info(`Body length: ${req.body?.length || 0}`);

    // Authentication
    if (!req.user) {
      logger.warn('POST /fragments: unauthenticated request');
      return res.status(401).json({ status: 'error', error: 'Authentication required' });
    }
    logger.info('✓ Authentication passed');

    // Content-Type header
    const ctHeader = req.headers['content-type'];
    if (!ctHeader) {
      logger.warn('POST /fragments: missing Content-Type header');
      return res.status(400).json({ status: 'error', error: 'Content-Type header is required' });
    }
    logger.info('✓ Content-Type header exists');

    let type;
    try {
      ({ type } = contentType.parse(ctHeader));
      logger.info(`✓ Parsed Content-Type: ${type}`);
    } catch (err) {
      logger.error(`POST /fragments: invalid Content-Type header - ${err.message}`);
      return res.status(400).json({ status: 'error', error: 'Invalid Content-Type' });
    }

    // Unsupported type
    if (!Fragment.isSupportedType(type)) {
      logger.warn(`POST /fragments: unsupported content type=${type}`);
      return res.status(415).json({ status: 'error', error: `Unsupported content type: ${type}` });
    }
    logger.info('✓ Content-Type is supported');

    // Body must be a Buffer
    if (!Buffer.isBuffer(req.body)) {
      logger.warn('POST /fragments: request body is not a Buffer');
      return res.status(400).json({ status: 'error', error: 'Request body must be binary data' });
    }
    logger.info('✓ Body is a Buffer');

    // Create fragment
    logger.info('Creating fragment...');
    const fragment = new Fragment({ ownerId: req.user, type });
    logger.info(`Fragment instance created: ${fragment.id}`);
    
    logger.info('Calling setData...');
    await fragment.setData(req.body);
    logger.info('✓ setData completed');
    
    logger.info('Calling save...');
    await fragment.save();
    logger.info('✓ save completed');

    // Location header
    const baseUrl = process.env.API_URL || `http://${req.headers.host}`;
    const location = new URL(`/v1/fragments/${fragment.id}`, baseUrl).toString();
    res.set('Location', location);

    logger.info(`POST /fragments: fragment created id=${fragment.id}`);
    logger.info('========== POST /v1/fragments SUCCESS ==========');
    res.status(201).json({ status: 'ok', fragment });
  } catch (err) {
    logger.error(`POST /fragments failed: ${err.message}`);
    logger.error(`Stack trace: ${err.stack}`);
    logger.error('========== POST /v1/fragments ERROR ==========');
    res.status(500).json({ status: 'error', error: 'Internal server error' });
  }
};
