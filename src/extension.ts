// El módulo 'vscode' contiene la API de extensibilidad de VS Code
// Importa el módulo y haz referencia a él con el alias 'vscode' en tu código a continuación
import * as vscode from "vscode";
import { convertToTemplate, createTemplate, removeTemplate } from "./commands";

// Este método se llama cuando tu extensión se activa
// Tu extensión se activa la primera vez que se ejecuta el comando
export function activate(context: vscode.ExtensionContext) {
  // Commands ids
  const CREATETEMPLATECOMANDID = "fast-folder-structure.selectTemplate";
  const CONVERTTOTEMPLATECOMANDID = "fast-folder-structure.convertToTemplate";
  const REMOVETEMPLATE = "fast-folder-structure.removeTemplate";
  // Ruta de la carpeta de plantillas
  const pathFolderTemplates = vscode.Uri.joinPath(
    context.extensionUri,
    "Templates"
  );

  // Esta línea de código se ejecutará solo una vez cuando tu extensión se active
  vscode.window.showInformationMessage(
    "Fast Folder Structure ahora está activa"
  );

  // El comando se ha definido en el archivo package.json
  // Ahora proporciona la implementación del comando con registerCommand
  // El parámetro commandId debe coincidir con el campo command en package.json
  const _createTemplate = vscode.commands.registerCommand(
    CREATETEMPLATECOMANDID,
    (destinationFolderPath: vscode.Uri) => {
      createTemplate(destinationFolderPath, pathFolderTemplates);
    }
  );

  const _convertToTemplate = vscode.commands.registerCommand(
    CONVERTTOTEMPLATECOMANDID,
    (pathFolder: vscode.Uri) => {
      convertToTemplate(pathFolder, pathFolderTemplates);
    }
  );

  const _removeTemplate = vscode.commands.registerCommand(
    REMOVETEMPLATE,
    () => {
      removeTemplate(pathFolderTemplates);
    }
  );

  context.subscriptions.push(
    _createTemplate,
    _convertToTemplate,
    _removeTemplate
  );
}

// Esta función se llama cuando tu extensión se desactiva
export function deactivate() {}
