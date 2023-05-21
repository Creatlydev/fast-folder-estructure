import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { promptForTargetDirectory } from "../utils";

export const convertToTemplate = async (
  pathFolder: vscode.Uri,
  pathFolderTemplates: vscode.Uri
) => {
  const isEmpty = (directory: string): boolean => {
    // Verificar si la carpeta no esta vacia
    return fs.readdirSync(directory, { encoding: "utf-8" }).length === 0;
  };
  const existsTemplate = (directory: string): boolean => {
    return fs.existsSync(directory);
  };

  if (!pathFolder) {
    let resource = await promptForTargetDirectory();
    if (resource) {
      pathFolder = vscode.Uri.file(resource);
    } else {
      vscode.window.showErrorMessage("No se selecciono carpeta");
      return;
    }
  }
  if (isEmpty(pathFolder.fsPath)) {
    vscode.window.showErrorMessage("La carpeta no debe estar vacia");
  } else {
    if (existsTemplate(path.basename(pathFolder.fsPath))) {
      vscode.window.showErrorMessage(
        `Ya existe una Template con el nombre ${path.basename(
          pathFolder.fsPath
        )}`
      );
    } else {
      // Convertir a Template
      convertFolderToTemplate(pathFolder.fsPath, pathFolderTemplates);
      vscode.window.showInformationMessage(
        `Creacion satisfactoria | Nueva Template '${path.basename(
          pathFolder.fsPath
        )}'`
      );
    }
  }
};

/**
 * Funcion para copiar el contenido del folder que se desea convertir a una plantilla
 * @param folderPathConvertToTemplate - Ruta del folder a convertir a Template
 * @param pathFolderTemplates - Ruta del folder donde se almacenan las Templates en la extension
 */
function convertFolderToTemplate(
  folderPathConvertToTemplate: string,
  pathFolderTemplates: vscode.Uri
) {
  const stats = fs.statSync(folderPathConvertToTemplate);
  let resourceName = path.basename(folderPathConvertToTemplate);

  if (stats.isFile()) {
    // Si es un archivo, copia el archivo a la carpeta de destino
    const destPath = path.join(pathFolderTemplates.fsPath, resourceName);
    fs.copyFileSync(folderPathConvertToTemplate, destPath);
  } else if (stats.isDirectory()) {
    // Si es una carpeta, copia toda la carpeta a la carpeta de destino
    let newTemplatePath = path.join(pathFolderTemplates.fsPath, resourceName);
    fs.mkdirSync(newTemplatePath);
    fs.readdirSync(folderPathConvertToTemplate).forEach((child) => {
      const childUri = vscode.Uri.file(
        path.join(folderPathConvertToTemplate, child)
      );
      convertFolderToTemplate(
        childUri.fsPath,
        vscode.Uri.file(newTemplatePath)
      );
    });
  }
}
