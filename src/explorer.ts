import { existsSync, readdirSync, statSync } from 'fs';
import { getExtensions, getRoot, getTestFileSuffix, getTestsRoots } from './config';
import { FileIsNotJavaScriptError, FileIsTestError, TestDirectoryIsNotFound } from './error';
import path = require('path');

export const jumpTo = (filepath: string, workSpacePath: string): string | undefined => {
  if (!isJs(filepath)) {
    throw new FileIsNotJavaScriptError(filepath);
  }

  if (isTest(filepath)) {
    return testToCode(filepath, workSpacePath);
  } else {
    return codeToTest(filepath, workSpacePath);
  }
};

export const suggestingTestPaths = (originalFilePath: string, workSpacePath: string): { absolutePath: string; relativePath: string }[] => {
  if (!isJs(originalFilePath)) {
    throw new FileIsNotJavaScriptError(originalFilePath);
  }

  if (isTest(originalFilePath)) {
    throw new FileIsTestError(originalFilePath);
  } else {
    const inTestRootPath = getSuggestionTestPathInTestRoot(originalFilePath, workSpacePath);

    return [inTestRootPath]
      .filter((v): v is string => Boolean(v))
      .map((absolutePath) => {
        const relativePath = shavePathFromStart(absolutePath, workSpacePath);
        return { absolutePath, relativePath };
      });
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

const codeToTest = (filepath: string, workSpacePath: string): string | undefined => {
  const testSuffix = getTestFileSuffix();
  const parsed = path.parse(filepath);
  const testFileName = `${parsed.name}${testSuffix}${parsed.ext}`;

  // explorer same folder
  if (existsSync(path.join(parsed.dir, testFileName))) {
    return path.join(parsed.dir, testFileName);
  }

  // explorer test folder
  try {
    const { directory: baseRoot, testRoot } = findNearestDirectoryHasTestRoot(filepath, workSpacePath);
    const keyPath = path.dirname(shavePathFromStart(filepath, baseRoot).replace(new RegExp(`^${getRoot()}${path.sep}?`), ''));

    const testKeyPath = path.join(baseRoot, testRoot, keyPath);
    const testIncludeRootPath = path.join(baseRoot, testRoot, getRoot(), keyPath);

    // foo/bar/src/foobar.ts → foo/bar/__tests__/foobar.test.ts
    if (existsSync(path.join(testKeyPath, testFileName))) {
      return path.join(testKeyPath, testFileName);
    }
    // foo/bar/src/foobar.ts → foo/bar/__tests__/foobar.ts
    if (existsSync(path.join(testKeyPath, parsed.base))) {
      return path.join(testKeyPath, parsed.base);
    }

    // foo/bar/src/foobar.ts → foo/bar/__tests__/src/foobar.test.ts
    if (existsSync(path.join(testIncludeRootPath, testFileName))) {
      return path.join(testIncludeRootPath, testFileName);
    }
    // foo/bar/src/foobar.ts → foo/bar/__tests__/src/foobar.ts
    if (existsSync(path.join(testIncludeRootPath, parsed.base))) {
      return path.join(testIncludeRootPath, parsed.base);
    }

    return undefined;
  } catch (err) {
    if (err instanceof TestDirectoryIsNotFound) {
      return undefined;
    }
  }
};

const testToCode = (filepath: string, workSpacePath: string): string | undefined => {
  const testSuffix = getTestFileSuffix();
  const parsed = path.parse(filepath);
  const removeTestFileName = `${parsed.name.replace(new RegExp(`${testSuffix}$`), '')}${parsed.ext}`;

  if (isInTest(filepath)) {
    const { directory: baseRoot } = findNearestDirectoryHasTestRoot(filepath);
    const keyPath = path.dirname(
      shavePathFromStart(filepath, baseRoot).replace(new RegExp(`^(${getTestsRoots().join('|')})${path.sep}?`), '')
    );
    const appendSrcRootPath = path.join(getRoot(), keyPath);

    // foo/bar/__tests__/foobar.test.ts → foo/bar/src/foobar.ts
    if (existsSync(path.join(baseRoot, appendSrcRootPath, removeTestFileName))) {
      return path.join(baseRoot, appendSrcRootPath, removeTestFileName);
    }

    // foo/bar/__tests__/foobar.test.ts → foo/bar/foobar.ts
    if (existsSync(path.join(baseRoot, keyPath, removeTestFileName))) {
      return path.join(baseRoot, keyPath, removeTestFileName);
    }
  }

  // explorer same folder
  if (existsSync(path.join(parsed.dir, removeTestFileName))) {
    return path.join(parsed.dir, removeTestFileName);
  }

  return undefined;
};

const getSuggestionTestPathInTestRoot = (originalFilePath: string, workSpacePath: string): string | null => {
  try {
    const { directory: baseRoot, testRoot } = findNearestDirectoryHasTestRoot(originalFilePath, workSpacePath);
    const keyPath = path.dirname(shavePathFromStart(originalFilePath, baseRoot).replace(new RegExp(`^${getRoot()}${path.sep}?`), ''));
    const testKeyPath = path.join(baseRoot, testRoot);
    const testIncludeRootPath = path.join(baseRoot, testRoot, getRoot());
    const testSuffix = getTestFileSuffix();
    const parsed = path.parse(originalFilePath);
    const testFileName = `${parsed.name}${testSuffix}${parsed.ext}`;

    if (existsSync(testIncludeRootPath)) {
      return path.join(testIncludeRootPath, keyPath, testFileName);
    } else {
      return path.join(testKeyPath, keyPath, testFileName);
    }
  } catch (e) {
    return null;
  }
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
  const shaverElements = shaverPath.split(path.sep);

  const matchingIndex = targetElements.findIndex((element, index) => {
    const amountElement = shaverElements[index];
    return element !== amountElement;
  });
  return path.join(...targetElements.splice(matchingIndex, targetElements.length - matchingIndex));
};

const findNearestDirectoryHasTestRoot = (currentDirectory: string, limitDirectory?: string): { directory: string; testRoot: string } => {
  const root = path.parse(currentDirectory).root;
  let workingDirectory = currentDirectory;

  while (true) {
    const testRoot = findTestDirectory(workingDirectory);
    if (testRoot) {
      return { directory: workingDirectory, testRoot };
    }
    if (limitDirectory && equalsPath(workingDirectory, limitDirectory)) {
      throw new TestDirectoryIsNotFound();
    }
    if (equalsPath(workingDirectory, root)) {
      throw new TestDirectoryIsNotFound();
    }
    workingDirectory = path.dirname(workingDirectory);
  }
};

const findTestDirectory = (currentDirectory: string): string | null => {
  const status = statSync(currentDirectory);
  if (status.isFile()) {
    return null;
  }

  const testRoots = getTestsRoots();

  const files = readdirSync(currentDirectory);
  const filtered = files.filter((file) => {
    const testRoot = testRoots.find((testRoot) => testRoot === file);
    if (!testRoot) {
      return null;
    }
    const status = statSync(path.join(currentDirectory, file));
    return status.isDirectory() ? testRoot : null;
  });
  return filtered.length > 0 ? filtered[0] : null;
};

const equalsPath = (path1: string, path2: string): boolean => {
  const normalizedPath1 = path.resolve(path1);
  const normalizedPath2 = path.resolve(path2);

  if (process.platform === 'win32') {
    return normalizedPath1.toLowerCase() === normalizedPath2.toLowerCase();
  }

  return path1 === path2;
};
