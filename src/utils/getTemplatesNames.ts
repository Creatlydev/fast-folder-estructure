import * as vscode from "vscode";
import * as fs from "fs";

/**
 * Obtiene los nombres de las plantillas desde las carpetas dentro de la carpeta de plantillas
 * @param pathFolderTemplates - Ruta donde se guardan las plantillas de la extension
 * @returns {string[]} - array de strings con los nombres de las plantillas disponibles
 */
export const getTemplatesNames = (
  pathFolderTemplates: vscode.Uri
): string[] => {
  const templateDirectories = fs
    .readdirSync(pathFolderTemplates.fsPath, { withFileTypes: true })
    .map((dirent) => dirent.name);

  return templateDirectories;
};
