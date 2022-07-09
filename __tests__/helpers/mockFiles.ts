import { merge } from 'lodash';
import { DirectoryItem, DirectoryItems } from 'mock-fs/lib/filesystem';
import * as path from 'path';
import * as mockFs from 'mock-fs';

const escapeRegExp = (str: string): string => {
  const reRegExp = /[\\^$.*+?()[\]{}|]/g;

  return str.replace(reRegExp, '\\$&');
};

export const trimCwd = (target: string): string => {
  return target.replace(new RegExp(`^${escapeRegExp(process.cwd())}`), '');
};

type MockFileProps = (
  | string
  | {
      file: string;
      option?: { folder?: boolean };
    }
)[];

export const mockFiles = (...props: MockFileProps): void => {
  const normalizedProps = props.map((prop) => (typeof prop === 'string' ? { file: prop, option: undefined } : prop));

  const nestedFiles = normalizedProps.map(({ file, option }) => {
    const dirs = file.split(path.sep).filter((name) => name !== '');
    return dirs.reverse().reduce<DirectoryItem>((acc, dir) => ({ [dir]: acc }), option?.folder ? {} : '');
  });

  const files = nestedFiles.reduce<DirectoryItems>((acc, object) => merge(acc, object), {});

  mockFs(files);
};
