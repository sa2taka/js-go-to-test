import * as path from 'path';
import * as vscode from 'vscode';
import { FileIsNotJavaScriptError } from './error';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';
import { JsTeleporter } from './js-teleporter';
import { getExtensions, getRoot, getStoryFileSuffix, getStoryRoots, getTestFileSuffix, getTestsRoots } from './config';

const openFile = (fileName: string) => {
  vscode.workspace.openTextDocument(fileName).then(vscode.window.showTextDocument);
  vscode.workspace.openTextDocument(fileName).then(vscode.window.showTextDocument);
};

const createFile = (file: string) => {
  const parsed = path.parse(file);
  mkdirp.sync(parsed.dir);
  if (!fs.existsSync(file)) {
    fs.closeSync(fs.openSync(file, 'w'));
  }
};

type PickItem = {
  label: string;
  absolutePath: string;
};

const suggestToCreateTest = async (document: vscode.TextDocument, workspacePath: string, teleporter: JsTeleporter) => {
  const suggestionPaths = teleporter.suggestingOtherworldPaths(document.fileName, workspacePath);

  if (suggestionPaths.length <= 0) {
    vscode.window.showInformationMessage('jump destination is not found.');
    return;
  }

  const quickPickItems: PickItem[] = suggestionPaths
    .map(({ absolutePath, relativePath }) => {
      return {
        label: relativePath,
        absolutePath,
      };
    })
    .concat([{ label: 'No', absolutePath: 'No' }]);
  const item = await vscode.window.showQuickPick<PickItem>(quickPickItems, {
    placeHolder: `The ${teleporter.otherworldName} file is not found. Create ${teleporter.otherworldName} file?`,
  });
  if (!item || item.absolutePath === 'No') {
    return;
  }
  createFile(item.absolutePath);
  openFile(item.absolutePath);
};

const escapeRegExp = (str: string): string => {
  const reRegExp = /[\\^$.*+?()[\]{}|]/g;

  return str.replace(reRegExp, '\\$&');
};

const jump = async (teleporter: JsTeleporter) => {
  var editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const document = editor.document;
  const relativePath = vscode.workspace.asRelativePath(document.fileName);
  const workspacePath = document.fileName.replace(new RegExp(`${escapeRegExp(relativePath)}$`), '');

  try {
    const destination = teleporter.jumpTo(document.fileName, workspacePath);
    if (!destination) {
      if (teleporter.isOtherworldFile(document.fileName)) {
        vscode.window.showInformationMessage('jump destination is not found.');
        return;
      }
      await suggestToCreateTest(document, workspacePath, teleporter);
      return;
    }
    openFile(destination);
  } catch (e) {
    if (e instanceof FileIsNotJavaScriptError) {
      vscode.window.showInformationMessage('the file is not javascript/typescript.');
    } else {
      vscode.window.showInformationMessage('some error is occurred.');
    }
  }
};

export function activate(context: vscode.ExtensionContext) {
  const disposableTestTeleporter = vscode.commands.registerCommand('js-teleporter.jump-test', async () => {
    const teleporter = new JsTeleporter({
      extensions: getExtensions(),
      srcRoot: getRoot(),
      otherworldName: 'test',
      otherworldFileSuffix: getTestFileSuffix(),
      otherworldFilesRoots: getTestsRoots(),
    });
    await jump(teleporter);
  });

  const disposableStoryTeleporter = vscode.commands.registerCommand('js-teleporter.jump-story', async () => {
    const teleporter = new JsTeleporter({
      extensions: getExtensions(),
      srcRoot: getRoot(),
      otherworldName: 'story',
      otherworldFileSuffix: getStoryFileSuffix(),
      otherworldFilesRoots: getStoryRoots(),
    });
    await jump(teleporter);
  });

  context.subscriptions.push(disposableTestTeleporter);
  context.subscriptions.push(disposableStoryTeleporter);
}

export function deactivate() {}
