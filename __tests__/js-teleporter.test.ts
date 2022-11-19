jest.mock('../src/config');

import * as fsMock from 'mock-fs';
import * as path from 'path';
import { FileIsNotJavaScriptError, FileIsOtherworldFileError } from '../src/error';
import { JsTeleporter } from '../src/js-teleporter';
import { mockFiles, trimCwd } from './helpers/mockFiles';

const extensions = ['js', 'ts', 'jsx', 'tsx'];
const srcRoot = 'src';
const testFolder = '__tests__';
const testSuffix = '.test';

describe('test teleporter', () => {
  const testTeleporter = new JsTeleporter({
    extensions,
    srcRoot,
    otherworldName: 'test',
    otherworldFileSuffix: testSuffix,
    otherworldFilesRoots: [testFolder],
  });

  const absolutePath = (relativePath: string): string => {
    return path.join(process.cwd(), relativePath);
  };

  const rootFolderName = 'root';
  const workspacePath = absolutePath(rootFolderName);

  afterEach(() => {
    fsMock.restore();
  });

  const buildPath = (...paths: string[]): string => {
    return path.join(...paths);
  };

  describe('#jumpTo', () => {
    describe.each([
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, testFolder, 'foo', 'bar', `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, testFolder, 'foo', 'bar', `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, testFolder, 'foo', 'bar', `index.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, srcRoot, testFolder, 'foo', 'bar', `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, srcRoot, testFolder, 'foo', 'bar', `index.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, srcRoot, 'foo', 'bar', testFolder, `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, srcRoot, 'foo', 'bar', testFolder, `index.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, srcRoot, 'foo', 'bar', `index${testSuffix}.ts`),
      },
    ])('should be success', ({ code, test }) => {
      beforeEach(() => {
        mockFiles(code, test);
      });
      it(`from ${trimCwd(code)} to ${trimCwd(test)}`, () => {
        const actual = testTeleporter.jumpTo(absolutePath(code), workspacePath);
        expect(actual).toBe(absolutePath(test));
      });

      it(`from ${test} to ${code}`, () => {
        const actual = testTeleporter.jumpTo(absolutePath(test), workspacePath);
        expect(actual).toBe(absolutePath(code));
      });
    });

    describe.each([
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, 'foo', 'bar', `dummy${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        test: buildPath(rootFolderName, 'foo', `index${testSuffix}.ts`),
      },
    ])('should return undefined', ({ code, test }) => {
      beforeEach(() => {
        mockFiles(code, test);
      });
      it(`from ${code} to ${test}`, () => {
        const actual = testTeleporter.jumpTo(absolutePath(code), workspacePath);
        expect(actual).toBeUndefined();
      });

      it(`from ${test} to ${code}`, () => {
        const actual = testTeleporter.jumpTo(absolutePath(test), workspacePath);
        expect(actual).toBeUndefined();
      });
    });

    it('should throw error if file is not js', () => {
      const path = buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.html');
      const absolute = absolutePath(path);
      expect(() => testTeleporter.jumpTo(absolute, workspacePath)).toThrowError(new FileIsNotJavaScriptError(absolute));
    });
  });

  describe('#suggestingOtherworldPaths', () => {
    it.each([
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        existsFolder: buildPath(rootFolderName, testFolder),
        relativeSuggestion: buildPath(rootFolderName, testFolder, 'foo', 'bar', `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, 'foo', 'bar', 'index.ts'),
        existsFolder: buildPath(rootFolderName, testFolder),
        relativeSuggestion: buildPath(rootFolderName, testFolder, 'foo', 'bar', `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        existsFolder: buildPath(rootFolderName, srcRoot, testFolder),
        relativeSuggestion: buildPath(rootFolderName, srcRoot, testFolder, 'foo', 'bar', `index${testSuffix}.ts`),
      },
      {
        code: buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.ts'),
        existsFolder: buildPath(rootFolderName, srcRoot, 'foo', 'bar', testFolder),
        relativeSuggestion: buildPath(rootFolderName, srcRoot, 'foo', 'bar', testFolder, `index${testSuffix}.ts`),
      },
    ])(
      'should suggest test file path. code: %code, testFolder: %existsFolder, expected: %relativeSuggestion',
      ({ code, existsFolder, relativeSuggestion }) => {
        mockFiles(code, { file: existsFolder, option: { folder: true } });

        const actual = testTeleporter.suggestingOtherworldPaths(absolutePath(code), workspacePath);
        expect(actual).toEqual([
          {
            absolutePath: absolutePath(relativeSuggestion),
            relativePath: relativeSuggestion.replace(new RegExp(`^${rootFolderName}${path.sep}`), ''),
          },
        ]);
      }
    );

    it('should throw error if file is not js', () => {
      const path = buildPath(rootFolderName, srcRoot, 'foo', 'bar', 'index.html');
      const absolute = absolutePath(path);
      expect(() => testTeleporter.suggestingOtherworldPaths(absolute, workspacePath)).toThrowError(new FileIsNotJavaScriptError(absolute));
    });

    it('should throw error if file is test', () => {
      const path = buildPath(rootFolderName, srcRoot, 'foo', 'bar', `index${testSuffix}.ts`);
      const absolute = absolutePath(path);
      expect(() => testTeleporter.suggestingOtherworldPaths(absolute, workspacePath)).toThrowError(
        new FileIsOtherworldFileError(absolute, 'test')
      );
    });
  });
});
