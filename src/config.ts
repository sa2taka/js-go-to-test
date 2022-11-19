import * as vscode from 'vscode';

export const getRoot = (): string => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('sourceRoot')!;
};

export const getTestsRoots = (): string[] => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('testSourceRoots')!;
};

export const getTestFileSuffix = (): string => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('testFileSuffix')!;
};

export const getStoryRoots = (): string[] => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('storybookSourceRoots')!;
};

export const getStoryFileSuffix = (): string => {
  return vscode.workspace.getConfiguration('jsTeleporter').get('storybookFileSuffix')!;
};

export const getExtensionsForTest = (): string[] => {
  return ['ts', 'js', 'tsx', 'jsx', 'mts', 'mjs', 'cts', 'cjs'];
};

export const getExtensionsForStory = (): string[] => {
  return ['tsx', 'jsx'];
};

export const getIgnorePaths = (): string[] => {
  return ['node_modules'];
};
