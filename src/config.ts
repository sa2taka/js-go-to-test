import * as vscode from 'vscode';

export const getTestsRoots = (): string[] => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('testSourceRoots')!;
};

export const getRoot = (): string => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('sourceRoot')!;
};

export const getTestFileSuffix = (): string => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('testFileSuffix')!;
};

export const getExtensions = (): string[] => {
  return ['ts', 'js', 'tsx', 'jsx', 'mts', 'mjs', 'cts', 'cjs'];
};

export const getIgnorePaths = (): string[] => {
  return ['node_modules'];
};
