import path = require('path');
import * as vscode from 'vscode';
import { FileIsNotJavaScriptError } from './error';
import { jumpTo } from './explorer';

const openFile = (fileName: string) => {
  vscode.workspace
    .openTextDocument(fileName)
    .then(vscode.window.showTextDocument);
};

const escapeRegExp = (str: string): string => {
  const reRegExp = /[\\^$.*+?()[\]{}|]/g;

  return str.replace(reRegExp, '\\$&');
};

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    'js-go-to-test.jump',
    () => {
      var editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const document = editor.document;
      const relativePath = vscode.workspace.asRelativePath(document.fileName);
      const workspacePath = document.fileName.replace(
        new RegExp(`${escapeRegExp(relativePath)}$`),
        ''
      );

      try {
        const related = jumpTo(relativePath, workspacePath);
        if (!related) {
          vscode.window.showInformationMessage(
            'jump destination is not found.'
          );
          return;
        }
        openFile(related);
      } catch (e) {
        if (e instanceof FileIsNotJavaScriptError) {
          vscode.window.showInformationMessage(
            'the file is not javascript/typescript.'
          );
        } else {
          vscode.window.showInformationMessage('some error is occurred.');
        }
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
