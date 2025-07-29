module.exports = {
  setRandomUserData,
  validateResponse,
  customMetric
};

function setRandomUserData(requestParams, context, ee, next) {
  context.vars.userId = Math.floor(Math.random() * 1000) + 1;
  context.vars.email = `user${context.vars.userId}@example.com`;
  context.vars.timestamp = new Date().toISOString();
  return next();
}

function validateResponse(requestParams, response, context, ee, next) {
  if (response.statusCode !== 200) {
    ee.emit('counter', 'custom.errors', 1);
  }
  
  // Custom validation logic
  if (response.body && JSON.parse(response.body).origin) {
    ee.emit('counter', 'custom.valid_responses', 1);
  }
  
  return next();
}

function customMetric(requestParams, response, context, ee, next) {
  // Track custom business metrics
  if (response.timings && response.timings.response > 1000) {
    ee.emit('counter', 'custom.slow_responses', 1);
  }
  
  ee.emit('histogram', 'custom.response_size', response.body ? response.body.length : 0);
  
  return next();
}
