export abstract class CustomErrorBase extends Error {
  constructor(message?: string) {
    super(message);
    const target = new.target;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    Object.setPrototypeOf(this, target.prototype);
    this.name = target.name;
  }
}

export class FileIsNotJavaScriptError extends CustomErrorBase {
  constructor(file: string) {
    super(`The file is not javascript/typescript. file: ${file}`);
  }
}

export class OtherworldDirectoryIsNotFound extends CustomErrorBase {}

export class FileIsOtherworldFileError extends CustomErrorBase {
  constructor(file: string, otherworldName: string) {
    super(`The file is ${otherworldName}. file: ${file}`);
  }
}
