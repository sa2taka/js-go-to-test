import { existsSync, readdirSync, statSync } from 'fs';
import { FileIsNotJavaScriptError, FileIsOtherworldFileError, OtherworldDirectoryIsNotFound } from './error';
import path = require('path');
import { workspace } from 'vscode';

type OtherworldName = 'test' | 'story';

export type TeleporterSetting = {
  extensions: string[];
  srcRoot: string;
  otherworldName: OtherworldName;
  otherworldFileSuffix: string;
  otherworldFilesRoots: string[];
};

export class JsTeleporter {
  constructor(private readonly setting: TeleporterSetting) {}

  get otherworldName() {
    return this.setting.otherworldName;
  }

  private get root() {
    return this.setting.srcRoot;
  }

  private get extensions() {
    return this.setting.extensions;
  }

  private get otherworldFileSuffix() {
    return this.setting.otherworldFileSuffix;
  }

  private get otherWorldFilesRoots() {
    return this.setting.otherworldFilesRoots;
  }

  teleportTo(filepath: string, workSpacePath: string): string | undefined {
    if (!this.isJsFile(filepath)) {
      throw new FileIsNotJavaScriptError(filepath);
    }

    if (this.isOtherworldFile(filepath)) {
      return this.fromOtherworld(filepath, workSpacePath);
    } else {
      return this.toOtherworld(filepath, workSpacePath);
    }
  }

  suggestingOtherworldPaths(originalFilePath: string, workSpacePath: string): { absolutePath: string; relativePath: string }[] {
    if (!this.isJsFile(originalFilePath)) {
      throw new FileIsNotJavaScriptError(originalFilePath);
    }

    if (this.isOtherworldFile(originalFilePath)) {
      throw new FileIsOtherworldFileError(originalFilePath, this.otherworldName);
    } else {
      const suggestionFile =
        this.getSuggestionOtherworldFilepathInOtherworld(originalFilePath, workSpacePath) ??
        this.getSuggestionOtherworldFilepathInSameDirectory(originalFilePath, workSpacePath);

      return [suggestionFile]
        .filter((v): v is string => Boolean(v))
        .map((absolutePath) => {
          const relativePath = this.shavePathFromStart(absolutePath, workSpacePath);
          return { absolutePath, relativePath };
        });
    }
  }

  isOtherworldFile(file: string): boolean {
    if (!this.isJsFile(file)) {
      return false;
    }

    const fileName = path.parse(file).name;
    if (fileName.match(new RegExp(`${this.otherworldFileSuffix}$`))) {
      return true;
    }

    return this.isInOtherworld(file);
  }

  isJsFile(file: string) {
    const extension = path.parse(file).ext.replace('.', '');
    return this.extensions.includes(extension);
  }

  private toOtherworld(filepath: string, workSpacePath: string): string | undefined {
    const parsed = path.parse(filepath);
    const otherworldFilename = `${parsed.name}${this.otherworldFileSuffix}${parsed.ext}`;

    // explorer same folder
    if (existsSync(path.join(parsed.dir, otherworldFilename))) {
      return path.join(parsed.dir, otherworldFilename);
    }

    // explorer otherworld folder
    try {
      const { directory: baseRoot, otherworldRoot } = this.findNearestDirectoryHasOtherworldRoot(filepath, workSpacePath);
      const keyPath = path.dirname(this.shavePathFromStart(filepath, baseRoot).replace(new RegExp(`^${this.root}${path.sep}?`), ''));

      const otherworldKeyPath = path.join(baseRoot, otherworldRoot, keyPath);
      const otherworldIncludeRootPath = path.join(baseRoot, otherworldRoot, this.root, keyPath);

      // foo/bar/src/foobar.ts → foo/bar/__otherworld__/foobar.otherworld.ts
      if (existsSync(path.join(otherworldKeyPath, otherworldFilename))) {
        return path.join(otherworldKeyPath, otherworldFilename);
      }
      // foo/bar/src/foobar.ts → foo/bar/__otherworld__/foobar.ts
      if (existsSync(path.join(otherworldKeyPath, parsed.base))) {
        return path.join(otherworldKeyPath, parsed.base);
      }

      // foo/bar/src/foobar.ts → foo/bar/__otherworld__/src/foobar.otherworld.ts
      if (existsSync(path.join(otherworldIncludeRootPath, otherworldFilename))) {
        return path.join(otherworldIncludeRootPath, otherworldFilename);
      }
      // foo/bar/src/foobar.ts → foo/bar/__otherworld__/src/foobar.ts
      if (existsSync(path.join(otherworldIncludeRootPath, parsed.base))) {
        return path.join(otherworldIncludeRootPath, parsed.base);
      }

      return undefined;
    } catch (err) {
      if (err instanceof OtherworldDirectoryIsNotFound) {
        return undefined;
      }
    }
  }

  private fromOtherworld(filepath: string, workSpacePath: string): string | undefined {
    const parsed = path.parse(filepath);
    const removedOtherworldFileSuffix = `${parsed.name.replace(new RegExp(`${this.otherworldFileSuffix}$`), '')}${parsed.ext}`;

    if (this.isInOtherworld(filepath)) {
      const { directory: baseRoot } = this.findNearestDirectoryHasOtherworldRoot(filepath);
      const keyPath = path.dirname(
        this.shavePathFromStart(filepath, baseRoot).replace(new RegExp(`^(${this.otherWorldFilesRoots.join('|')})${path.sep}?`), '')
      );
      const appendSrcRootPath = path.join(this.root, keyPath);

      // foo/bar/__otherworld__/foobar.otherworld.ts → foo/bar/src/foobar.ts
      if (existsSync(path.join(baseRoot, appendSrcRootPath, removedOtherworldFileSuffix))) {
        return path.join(baseRoot, appendSrcRootPath, removedOtherworldFileSuffix);
      }

      // foo/bar/__otherworld__/foobar.otherworld.ts → foo/bar/foobar.ts
      if (existsSync(path.join(baseRoot, keyPath, removedOtherworldFileSuffix))) {
        return path.join(baseRoot, keyPath, removedOtherworldFileSuffix);
      }
    }

    // explorer same folder
    if (existsSync(path.join(parsed.dir, removedOtherworldFileSuffix))) {
      return path.join(parsed.dir, removedOtherworldFileSuffix);
    }

    return undefined;
  }

  private getSuggestionOtherworldFilepathInOtherworld(originalFilePath: string, workSpacePath: string): string | null {
    try {
      const { directory: baseRoot, otherworldRoot } = this.findNearestDirectoryHasOtherworldRoot(originalFilePath, workSpacePath);
      const keyPath = path.dirname(
        this.shavePathFromStart(originalFilePath, baseRoot).replace(new RegExp(`^${this.root}${path.sep}?`), '')
      );
      const otherworldKeyPath = path.join(baseRoot, otherworldRoot);
      const otherworldIncludeRootPath = path.join(baseRoot, otherworldRoot, this.root);

      const parsed = path.parse(originalFilePath);
      const testFileName = `${parsed.name}${this.otherworldFileSuffix}${parsed.ext}`;

      if (existsSync(otherworldIncludeRootPath)) {
        return path.join(otherworldIncludeRootPath, keyPath, testFileName);
      } else {
        return path.join(otherworldKeyPath, keyPath, testFileName);
      }
    } catch (e) {
      return null;
    }
  }

  private getSuggestionOtherworldFilepathInSameDirectory(originalFilePath: string, workSpacePath: string): string | null {
    const parsed = path.parse(originalFilePath);
    const otherworldFilename = `${parsed.name}${this.otherworldFileSuffix}${parsed.ext}`;

    return path.join(parsed.dir, otherworldFilename);
  }

  private isInOtherworld(filepath: string): boolean {
    const sep = path.sep;
    return this.otherWorldFilesRoots.some((otherworldRoot) => {
      const regexp = new RegExp(`[${sep}^]${otherworldRoot}[${sep}$]`);
      return regexp.test(filepath);
    });
  }

  private shavePathFromStart(target: string, shaverPath: string): string {
    const targetElements = target.split(path.sep);
    const shaverElements = shaverPath.split(path.sep);

    const matchingIndex = targetElements.findIndex((element, index) => {
      const amountElement = shaverElements[index];
      return element !== amountElement;
    });
    return path.join(...targetElements.splice(matchingIndex, targetElements.length - matchingIndex));
  }

  private findNearestDirectoryHasOtherworldRoot(
    currentDirectory: string,
    limitDirectory?: string
  ): { directory: string; otherworldRoot: string } {
    const root = path.parse(currentDirectory).root;
    let workingDirectory = currentDirectory;

    while (true) {
      const otherworldRoot = this.findOtherworldRootDirectoryName(workingDirectory);
      if (otherworldRoot) {
        return { directory: workingDirectory, otherworldRoot };
      }
      if (limitDirectory && this.equalsPath(workingDirectory, limitDirectory)) {
        throw new OtherworldDirectoryIsNotFound();
      }
      if (this.equalsPath(workingDirectory, root)) {
        throw new OtherworldDirectoryIsNotFound();
      }
      workingDirectory = path.dirname(workingDirectory);
    }
  }

  private findOtherworldRootDirectoryName(currentDirectory: string): string | null {
    const status = statSync(currentDirectory);
    if (status.isFile()) {
      return null;
    }

    const files = readdirSync(currentDirectory);
    const filtered = files.filter((file) => {
      const otherworldRoot = this.otherWorldFilesRoots.find((otherworldRoot) => otherworldRoot === file);
      if (!otherworldRoot) {
        return null;
      }
      const status = statSync(path.join(currentDirectory, file));
      return status.isDirectory() ? otherworldRoot : null;
    });
    return filtered.length > 0 ? filtered[0] : null;
  }

  private equalsPath(path1: string, path2: string): boolean {
    const normalizedPath1 = path.resolve(path1);
    const normalizedPath2 = path.resolve(path2);

    if (process.platform === 'win32') {
      return normalizedPath1.toLowerCase() === normalizedPath2.toLowerCase();
    }

    return path1 === path2;
  }
}
