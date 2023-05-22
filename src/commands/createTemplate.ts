import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { promptForSelectTemplate } from "../utils";

export const createTemplate = async (
  destinationFolderPath: vscode.Uri,
  pathFolderTemplates: vscode.Uri
) => {
  // Comprobar si el pathFolderTemplates es valido y su esquema es 'file'
  if (!(destinationFolderPath && destinationFolderPath.scheme === "file")) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      vscode.window.showErrorMessage(
        "No se abierto ninguna carpeta de trabajo"
      );
      return;
    } else {
      destinationFolderPath = workspaceFolders[0].uri;
    }
  }

  // Abrir lista de templates
  await promptForSelectTemplate(pathFolderTemplates).then((option) => {
    if (option) {
      let templateName = option.label;
      let pathFolderTemplateSelected = vscode.Uri.file(
        path.join(pathFolderTemplates.fsPath, templateName)
      );
      createStructureFromTemplate(
        pathFolderTemplateSelected,
        destinationFolderPath.fsPath
      );
      vscode.window.showInformationMessage(
        `Creacion satisfactoria | Template '${templateName}'`
      );
    } else {
      vscode.window.showErrorMessage("No se selecciono Template");
      return;
    }
  });
};

/**
 * Funcion para crear la estructura de carpetas que contine la plantilla seleccionada
 * @param pathFolderTemplateSelected - Ruta de la plantilla seleccionada
 * @param destinationFolderPath - Ruta de destino donde se creara la plantilla seleccionada
 */
function createStructureFromTemplate(
  pathFolderTemplateSelected: vscode.Uri,
  destinationFolderPath: string
) {
  const childsFolderTemplateSelected = fs.readdirSync(
    pathFolderTemplateSelected.fsPath,
    { withFileTypes: true }
  );
  // Obtener el valor de la propiedad para saber si desea reemplazar, omitir o preguntar sobre que hacer con los recursos que ya existen desde la configuración
  const replaceOption = vscode.workspace
    .getConfiguration("fast-folder-structure")
    .get("ReplaceFileOrFolderExistents");

  childsFolderTemplateSelected.forEach(async (child) => {
    const filePath = path.join(pathFolderTemplateSelected.fsPath, child.name);
    const newPath = path.join(destinationFolderPath, child.name);
    if (child.isFile()) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      fs.writeFileSync(newPath, fileContent);
    } else if (child.isDirectory()) {
      if (!fs.existsSync(newPath)) {
        fs.mkdirSync(newPath);
      }
      createStructureFromTemplate(vscode.Uri.file(filePath), newPath);
    }
  });
}
