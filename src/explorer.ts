import { existsSync, readdirSync, statSync } from 'fs';
import path = require('path');
import {
  getExtensions,
  getRoot,
  getTestFileSuffix,
  getTestsRoots,
} from './config';
import { FileIsNotJavaScriptError, CustomErrorBase } from './error';

class DirectoryIsNotFound extends CustomErrorBase {}

export const jumpTo = (
  filepath: string,
  workSpacePath: string
): string | undefined => {
  if (!isJs(filepath)) {
    throw new FileIsNotJavaScriptError(filepath);
  }

  if (isTest(filepath)) {
    return testToCode(filepath, workSpacePath);
  } else {
    return codeToTest(filepath, workSpacePath);
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

  return isInTest(file);
};

export const isJs = (file: string) => {
  const extension = path.parse(file).ext.replace('.', '');
  return getExtensions().includes(extension);
};

const codeToTest = (
  filepath: string,
  workSpacePath: string
): string | undefined => {
  const testSuffix = getTestFileSuffix();
  const parsed = path.parse(filepath);
  const testFileName = `${parsed.name}${testSuffix}${parsed.ext}`;

  // explorer same folder
  if (existsSync(path.join(parsed.dir, testFileName))) {
    return path.join(parsed.dir, testFileName);
  }

  // explorer test folder
  try {
    const baseRoot = findNearestDirectoryHasTestRoot(filepath, workSpacePath);
    const keyPath = path.dirname(
      shavePathFromStart(filepath, baseRoot).replace(
        new RegExp(`^${getRoot()}${path.sep}?`),
        ''
      )
    );

    const tests = getTestsRoots()
      .map((testRoot) => {
        const testKeyPath = path.join(baseRoot, testRoot, keyPath);
        const testIncludeRootPath = path.join(
          baseRoot,
          testRoot,
          getRoot(),
          keyPath
        );

        // foo/bar/src/foobar.ts → foo/bar/__tests__/foobar.test.ts
        if (existsSync(path.join(testKeyPath, testFileName))) {
          return path.join(testKeyPath, testFileName);
        }
        // foo/bar/src/foobar.ts → foo/bar/__tests__/foobar.ts
        if (existsSync(path.join(testKeyPath, parsed.name))) {
          return path.join(testKeyPath, parsed.name);
        }

        // foo/bar/src/foobar.ts → foo/bar/__tests__/src/foobar.test.ts
        if (existsSync(path.join(testIncludeRootPath, testFileName))) {
          return path.join(testIncludeRootPath, testFileName);
        }
        // foo/bar/src/foobar.ts → foo/bar/__tests__/src/foobar.ts
        if (existsSync(path.join(testIncludeRootPath, parsed.name))) {
          return path.join(testIncludeRootPath, parsed.name);
        }

        return undefined;
      })
      .filter((file): file is string => !!file);

    return tests.length > 0 ? tests[0] : undefined;
  } catch (err) {
    if (err instanceof DirectoryIsNotFound) {
      return undefined;
    }
  }
};

const testToCode = (
  filepath: string,
  workSpacePath: string
): string | undefined => {
  const testSuffix = getTestFileSuffix();
  const parsed = path.parse(filepath);
  const removeTestFileName = `${parsed.name.replace(
    new RegExp(`${testSuffix}$`),
    ''
  )}${parsed.ext}`;

  if (isInTest(filepath)) {
    const baseRoot = findNearestDirectoryHasTestRoot(filepath);
    const keyPath = path.dirname(
      shavePathFromStart(filepath, baseRoot).replace(
        new RegExp(`^(${getTestsRoots().join('|')})${path.sep}?`),
        ''
      )
    );
    const appendSrcRootPath = path.join(getRoot(), keyPath);

    // foo/bar/__tests__/foobar.test.ts → foo/bar/src/foobar.ts
    if (
      existsSync(path.join(baseRoot, appendSrcRootPath, removeTestFileName))
    ) {
      return path.join(baseRoot, appendSrcRootPath, removeTestFileName);
    }

    // foo/bar/__tests__/foobar.test.ts → foo/bar/foobar.ts
    if (existsSync(path.join(baseRoot, keyPath, removeTestFileName))) {
      return path.join(baseRoot, keyPath, removeTestFileName);
    }
  }

  // explorer same folder
  if (existsSync(path.join(workSpacePath, parsed.dir, removeTestFileName))) {
    return path.join(workSpacePath, parsed.dir, removeTestFileName);
  }

  return undefined;
};

const isInTest = (filepath: string): boolean => {
  const testRoots = getTestsRoots();
  const sep = path.sep;
  return testRoots.some((testRoot) => {
    const regexp = new RegExp(`[${sep}^]${testRoot}[${sep}$]`);
    return regexp.test(filepath);
  });
};

const shavePathFromStart = (target: string, shaverPath: string): string => {
  const targetElements = target.split(path.sep);
  const amountElements = shaverPath.split(path.sep);

  const matchingIndex = targetElements.findIndex((element, index) => {
    const amountElement = amountElements[index];
    return element !== amountElement;
  });
  return path.join(
    ...targetElements.splice(
      matchingIndex,
      targetElements.length - matchingIndex
    )
  );
};

const findNearestDirectoryHasTestRoot = (
  currentDirectory: string,
  limitDirectory?: string
): string => {
  const root = path.parse(currentDirectory).root;
  let workingDirectory = currentDirectory;

  while (true) {
    if (hasTestDirectory(workingDirectory)) {
      return workingDirectory;
    }
    if (limitDirectory && equalsPath(workingDirectory, limitDirectory)) {
      throw new DirectoryIsNotFound();
    }
    if (equalsPath(workingDirectory, root)) {
      throw new DirectoryIsNotFound();
    }
    workingDirectory = path.dirname(workingDirectory);
  }
};

const hasTestDirectory = (currentDirectory: string): boolean => {
  const status = statSync(currentDirectory);
  if (status.isFile()) {
    return false;
  }

  const testRoots = getTestsRoots();

  const files = readdirSync(currentDirectory);
  return files.some((file) => {
    if (!testRoots.includes(file)) {
      return false;
    }
    const status = statSync(path.join(currentDirectory, file));
    return status.isDirectory();
  });
};

const hasSrcDirectory = (currentDirectory: string): boolean => {
  const status = statSync(currentDirectory);
  if (status.isFile()) {
    return false;
  }

  const root = getRoot();

  const files = readdirSync(currentDirectory);
  return files.some((file) => {
    if (file !== root) {
      return false;
    }
    const status = statSync(path.join(currentDirectory, file));
    return status.isDirectory();
  });
};

const equalsPath = (path1: string, path2: string): boolean => {
  const normalizedPath1 = path.resolve(path1);
  const normalizedPath2 = path.resolve(path2);

  if (process.platform === 'win32') {
    return normalizedPath1.toLowerCase() === normalizedPath2.toLowerCase();
  }

  return path1 === path2;
};
