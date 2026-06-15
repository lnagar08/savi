export class CustomError extends Error {
  name = "CustomError";
  status: number;
  errors?: unknown;

  constructor(message: string, status: number = 400, errors?: unknown) {
    super(message);
    this.status = status;
    if (errors !== undefined) {
      this.errors = errors;
    }
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}
