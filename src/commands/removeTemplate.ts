import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import {
  promptForSelectTemplate,
  promtForConfirmRemoveTemplate,
} from "../utils";

export const removeTemplate = async (pathFolderTemplates: vscode.Uri) => {
  // Abrir lista de templates
  await promptForSelectTemplate(pathFolderTemplates).then(async (option) => {
    if (option) {
      let templateName = option.label;
      let pathFolderTemplateSelected = vscode.Uri.file(
        path.join(pathFolderTemplates.fsPath, templateName)
      );

      await promtForConfirmRemoveTemplate(templateName).then((option) => {
        if (option === "Confirmar") {
          // Eliminar template
          deleteFolderRecursive(pathFolderTemplateSelected.fsPath);
          vscode.window.showInformationMessage(
            `Se elimino satisfactoriamente | Template '${templateName}'`
          );
        } else {
          vscode.window.showInformationMessage("Se cancelo la operacion");
        }
      });
    } else {
      vscode.window.showErrorMessage("No se selecciono Template a eliminar");
      return;
    }
  });
};

function deleteFolderRecursive(folderPath: string) {
  fs.readdirSync(folderPath).forEach((file) => {
    const filePath = path.join(folderPath, file);
    if (fs.lstatSync(filePath).isDirectory()) {
      deleteFolderRecursive(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  });
  fs.rmdirSync(folderPath);
}
