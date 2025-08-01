const serverless = require('serverless-http');
const app = require('./app');

module.exports.handler = serverless(app, {
  request: (req, event, context) => {
    const contentType = req.headers['content-type'] || req.headers['Content-Type'];

    if (
      (Buffer.isBuffer(req.body) || typeof req.body === 'string') &&
      contentType &&
      contentType.includes('application/json')
    ) {
      try {
        req.body = JSON.parse(req.body.toString());
      } catch (e) {
        console.error('JSON parse error:', e);
      }
    }
  }
});
