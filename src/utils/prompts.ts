import {
  InputBoxOptions,
  OpenDialogOptions,
  QuickPickItem,
  window,
} from "vscode";

import { getTemplatesNames } from "./getTemplatesNames";
import * as vscode from "vscode";

export async function promptForTargetDirectory(): Promise<string | undefined> {
  const options: OpenDialogOptions = {
    canSelectMany: false,
    title: "Selecciona un folder para convertir a Template",
    openLabel: "Selecciona folder",
    canSelectFolders: true,
    canSelectFiles: false,
    defaultUri: vscode.Uri.file("./"),
  };

  return window.showOpenDialog(options).then((uri) => {
    if (uri === undefined) {
      return undefined;
    }
    return uri[0].fsPath;
  });
}

export async function promptForSelectTemplate(pathFolderTemplates: vscode.Uri) {
  const allTemplatesNames = getTemplatesNames(pathFolderTemplates);

  let templatesNames: QuickPickItem[] = [];

  allTemplatesNames.forEach((name) => {
    templatesNames.push({
      label: name,
      description: "Igual para todos",
      detail: "$(x) Eliminar plantilla",
    });
  });

  return window.showQuickPick(templatesNames, {
    placeHolder: "Selecciona una Template",
  });
}
