import * as path from 'path';
import * as vscode from 'vscode';
import { FileIsNotJavaScriptError } from './error';
import { isTest, jumpTo, suggestingTestPaths } from './explorer';
import * as mkdirp from 'mkdirp';
import * as fs from 'fs';

const openFile = (fileName: string) => {
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

const suggestToCreateTest = async (document: vscode.TextDocument, workspacePath: string) => {
  const suggestionPaths = suggestingTestPaths(document.fileName, workspacePath);

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
    placeHolder: `The test file is not found. Create test file?`,
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

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand('js-teleporter.jump', async () => {
    var editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    const document = editor.document;
    const relativePath = vscode.workspace.asRelativePath(document.fileName);
    const workspacePath = document.fileName.replace(new RegExp(`${escapeRegExp(relativePath)}$`), '');

    try {
      const destination = jumpTo(document.fileName, workspacePath);
      if (!destination) {
        if (isTest(document.fileName)) {
          vscode.window.showInformationMessage('jump destination is not found.');
          return;
        }
        await suggestToCreateTest(document, workspacePath);
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
  });

  context.subscriptions.push(disposable);
}

export function deactivate() {}
