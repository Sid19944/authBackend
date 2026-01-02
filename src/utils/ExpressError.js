class ExpressError extends Error {
  constructor(status, error = [], message = "Something went wong") {
    super();
    this.status = status;
    this.error = error;
    this.message = message;
    this.success = false;
  }
}

export { ExpressError };
