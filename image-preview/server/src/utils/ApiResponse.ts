class ApiResponse {
  success: true;
  statusCode: number;
  message: string;
  data: Record<string, any>;

  constructor(
    data: Record<string, any> = {},
    statusCode: number = 200,
    message: string = "Success",
  ) {
    this.success = true;
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }
}

export default ApiResponse;
