function logSmtpError(context, err) {
  console.error(`[SMTP] ${context} failed:`, {
    message: err.message,
    code: err.code,
    command: err.command,
    response: err.response,
    responseCode: err.responseCode,
    stack: err.stack,
  });
}

module.exports = logSmtpError;
