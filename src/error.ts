class SuperError extends Error {
  constructor(text: string, errorConstructor: Function) {
    super(text);
    this.name = 'NonExistVirtualBillError';
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, errorConstructor);
    }
    Object.setPrototypeOf(this, errorConstructor.prototype);
  }
}

export class FileIsNotJavaScriptError extends SuperError {
  constructor(file: string) {
    super(
      `The file is not javascript/typescript. file: ${file}`,
      FileIsNotJavaScriptError
    );
  }
}
