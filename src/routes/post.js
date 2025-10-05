const express = require('express');
const contentType = require('content-type');
const { Fragment } = require('../../model/fragment');
const postHandler = require('./post');

const router = express.Router();


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

router.post('/fragments', rawBody(), postHandler);

module.exports = router;
