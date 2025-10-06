// src/routes/api/index.js

/**
 * The main entry-point for the v1 version of the fragments API.
 */
const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');

// Create a router on which to mount our API endpoints
const router = express.Router();

// Raw body parser middleware
const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const ct = req.headers['content-type'];
      if (!ct) return false;

      try {
        const { type } = contentType.parse(ct);
        return Fragment.isSupportedType(type);
      } catch {
        return false;
      }
    },
  });
  
router.get('/fragments', require('./get'));

router.post('/fragments', rawBody(), require('./post'));

module.exports = router;
