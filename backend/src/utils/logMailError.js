function logMailError(context, err) {
  console.error(`[Mail] ${context} failed:`, {
    message: err.message,
    status: err.status,
    body: err.body,
    stack: err.stack,
  });
}

module.exports = logMailError;
