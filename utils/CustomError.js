class CustomError extends Error {
  constructor(httpStatusCode, message) {
    this.httpStatusCode = httpStatusCode;
    super(message);
  }
}

module.exports = CustomError;
