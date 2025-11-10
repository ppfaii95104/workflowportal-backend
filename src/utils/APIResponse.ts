import type { IPagination } from "../interfaces/Ibase.js";

// Defining API response using Class
export class APIResponse<T> {
  status: number;
  message: string;
  data: T | undefined; // <- แก้ตรงนี้
  pagination?: IPagination | undefined;
  error?: string | undefined;

  constructor(
    status: number,
    message: string,
    data?: T,
    pagination?: IPagination,
    error?: string
  ) {
    this.status = status;
    this.message = message;
    this.data = data;
    this.pagination = pagination;
    this.error = error;
  }

  // Method to format the response as a string
  toString(): string {
    return `Status: ${this.status}, Message: ${
      this.message
    }, Data: ${JSON.stringify(this.data)}`;
  }

  // Method to create a success response
  static success<T>(data: T): APIResponse<T> {
    return new APIResponse(200, "Success", data);
  }

  static successWithPaging<T>(
    data: T,
    pagination: IPagination
  ): APIResponse<T> {
    return new APIResponse(200, "Success", data, pagination);
  }

  static successWithMessage<T>(message: string, data: T): APIResponse<T> {
    return new APIResponse(200, message, data);
  }

  // Method to create an error response
  static error(message: string, status: number = 500): APIResponse<null> {
    return new APIResponse(status, message, null);
  }
}

// Example usage of APIResponse class
const successResponse = APIResponse.success({ id: 1, name: "John Doe" });
console.log(successResponse.toString());

const errorResponse = APIResponse.error("User not found", 404);
console.log(errorResponse.toString());
