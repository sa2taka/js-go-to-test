import { existsSync } from 'fs';
import path = require('path');
import {
  getExtensions,
  getRoot,
  getTestFileSuffix,
  getTetsRoots,
} from './config';
import { FileIsNotJavaScriptError } from './error';

export const jumpTo = (
  relativeFilePath: string,
  workSpacePath: string
): string | undefined => {
  if (!isJs(relativeFilePath)) {
    throw new FileIsNotJavaScriptError(relativeFilePath);
  }

  if (isTest(relativeFilePath)) {
    return testToCode(relativeFilePath, workSpacePath);
  } else {
    return codeToTest(relativeFilePath, workSpacePath);
  }
};

export const isTest = (file: string): boolean => {
  if (!isJs(file)) {
    return false;
  }

  const testSuffix = getTestFileSuffix();
  const fileName = path.parse(file).name;
  if (fileName.match(new RegExp(`${testSuffix}$`))) {
    return true;
  }

  return getTetsRoots().some((testRoot) => file.startsWith(testRoot));
};

export const isJs = (file: string) => {
  const extension = path.parse(file).ext.replace('.', '');
  return getExtensions().includes(extension);
};

const codeToTest = (
  relativeFilePath: string,
  workSpacePath: string
): string | undefined => {
  const testSuffix = getTestFileSuffix();
  const parsed = path.parse(relativeFilePath);
  const testFileName = `${parsed.name}${testSuffix}${parsed.ext}`;

  // explorer same folder
  if (existsSync(path.join(workSpacePath, parsed.dir, testFileName))) {
    return path.join(workSpacePath, parsed.dir, testFileName);
  }

  // explorer test folder
  const keyPath = parsed.dir.replace(new RegExp(`${getRoot()}/?`), '');
  const tests = getTetsRoots()
    .map((testRoot) => {
      const testKeyPath = path.join(workSpacePath, testRoot, keyPath);
      const testIncludeRootPath = path.join(
        workSpacePath,
        testRoot,
        parsed.dir
      );

      if (existsSync(path.join(testKeyPath, testFileName))) {
        return path.join(testKeyPath, testFileName);
      }
      if (existsSync(path.join(testKeyPath, parsed.name))) {
        return path.join(testKeyPath, parsed.name);
      }
      if (existsSync(path.join(testIncludeRootPath, testFileName))) {
        return path.join(testIncludeRootPath, testFileName);
      }

      if (existsSync(path.join(testIncludeRootPath, parsed.name))) {
        return path.join(testIncludeRootPath, parsed.name);
      }
      return undefined;
    })
    .filter((file): file is string => !!file);

  if (tests.length <= 0) {
    return undefined;
  }

  return tests[0];
};

const testToCode = (
  relativeFilePath: string,
  workSpacePath: string
): string | undefined => {
  const testSuffix = getTestFileSuffix();
  const parsed = path.parse(relativeFilePath);
  const removeTestFileName = `${parsed.name.replace(
    new RegExp(`${testSuffix}$`),
    ''
  )}${parsed.ext}`;

  // if file is in test folder
  if (
    getTetsRoots().some((testRoot) => relativeFilePath.startsWith(testRoot))
  ) {
    const testRootPath = getTetsRoots().filter((testRoot) =>
      relativeFilePath.startsWith(testRoot)
    )[0];
    const keyPath = parsed.dir.replace(new RegExp(`${testRootPath}/?`), '');
    const appendSrcRootPath = path.join(workSpacePath, getRoot(), keyPath);

    if (existsSync(path.join(appendSrcRootPath, removeTestFileName))) {
      return path.join(appendSrcRootPath, removeTestFileName);
    }
    if (existsSync(path.join(workSpacePath, keyPath, removeTestFileName))) {
      return path.join(workSpacePath, keyPath, removeTestFileName);
    }
  }

  // explorer same folder
  if (existsSync(path.join(workSpacePath, parsed.dir, removeTestFileName))) {
    return path.join(workSpacePath, parsed.dir, removeTestFileName);
  }

  return undefined;
};
