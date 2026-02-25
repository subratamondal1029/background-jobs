class ApiError extends Error {
  success: false;
  statusCode: number;
  message: string;
  data: null;
  errors: any[];
  track?: string;

  constructor(
    statusCode: number = 500,
    message: string = "Internal Server Error",
    track?: string,
    errors: any[] = [],
  ) {
    super(message);

    this.success = false;
    this.data = null;
    this.statusCode = statusCode;
    this.message = message;

    this.errors = errors;

    if (track) {
      this.track = track;
    } else {
      Error.captureStackTrace(this, this.constructor);
      this.track = this.stack;
    }
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
    };
  }

  getTrack() {
    return this.track;
  }
}

export default ApiError;
