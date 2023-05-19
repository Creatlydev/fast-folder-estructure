// El módulo 'vscode' contiene la API de extensibilidad de VS Code
// Importa el módulo y haz referencia a él con el alias 'vscode' en tu código a continuación
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

// Este método se llama cuando tu extensión se activa
// Tu extensión se activa la primera vez que se ejecuta el comando
export function activate(context: vscode.ExtensionContext) {
  // IDs constantes
  const selectTemplateComandId = "fast-folder-structure.selectTemplate";
  const convertToTemplateComandId = "fast-folder-structure.convertToTemplate";
  // Ruta de la carpeta de plantillas
  const templatesFolderPath = vscode.Uri.joinPath(
    context.extensionUri,
    "Templates"
  );

  // Utiliza la consola para imprimir información de diagnóstico (console.log) y errores (console.error)
  // Esta línea de código se ejecutará solo una vez cuando tu extensión se active
  console.log(
    '¡Felicitaciones, tu extensión "fast-folder-structure" está activa ahora!'
  );
  // El comando se ha definido en el archivo package.json
  // Ahora proporciona la implementación del comando con registerCommand
  // El parámetro commandId debe coincidir con el campo command en package.json
  const selectTemplate = vscode.commands.registerCommand(
    selectTemplateComandId,
    (resource: vscode.Uri) => {
      // Comprueba si el recurso es válido y su esquema es "file".
      if (resource && resource.scheme === "file") {
        var destinationFolderPath = resource.fsPath;
        showQuickPick(templatesFolderPath, destinationFolderPath);
      } else {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders || workspaceFolders.length === 0) {
          vscode.window.showErrorMessage(
            "No se ha abierto ninguna carpeta de trabajo."
          );
          return;
        }

        const rootPath = workspaceFolders[0].uri;
        var destinationFolderPath = path.join(rootPath.fsPath);
        showQuickPick(templatesFolderPath, destinationFolderPath);
      }
    }
  );

  const convertToTemplate = vscode.commands.registerCommand(
    convertToTemplateComandId,
    async (resource: vscode.Uri) => {
      // Lógica para convertir a plantilla
      const name = await vscode.window.showInputBox({
        prompt:
          "Ingresa un nombre para tu plantilla ó (deja en blanco para dejar el nombre del folder o archivo seleccionado)",
        placeHolder: "Nombre de la plantilla",
      });

      if (name !== undefined) {
        convertFileOrFolderToTemplate(
          resource.fsPath,
          name,
          templatesFolderPath
        );
      }
    }
  );

  context.subscriptions.push(selectTemplate, convertToTemplate);
}

// Esta funcion se llama cuando tu extensión se desactiva
export function deactivate() {}

// Muestra el cuadro de selección rápida para que el usuario elija una plantilla
function showQuickPick(
  templatesFolderPath: vscode.Uri,
  destinationFolderPath: string
) {
  const allTemplates: string[] = getTemplateNames(templatesFolderPath);
  vscode.window
    .showQuickPick(allTemplates, { placeHolder: "Selecciona una plantilla" })
    .then((selectedTemplate) => {
      if (selectedTemplate) {
        // Construye la ruta completa de la carpeta de una plantilla seleccionada
        const templateFolderPath = vscode.Uri.joinPath(
          templatesFolderPath,
          selectedTemplate
        );

        // Llama a la funcion para crear la estructura utilizando la plantilla seleccionada y la carpeta de destino
        // createStructureFromTemplate(templateFolderPath, destinationFolderPath);
        // vscode.window.showInformationMessage('¡Felicitaciones! Has creado tu plantilla. ¡Let\'s Go!');
        createStructureFromTemplate(
          templateFolderPath,
          destinationFolderPath,
          () => {
            vscode.window.showInformationMessage(
              "¡Felicitaciones! Has creado tu plantilla. ¡Let's Go!"
            );
          }
        );
      }
    });
}

// Obtiene los nombres de las plantillas desde las carpetas dentro de la carpeta de plantillas
function getTemplateNames(templatesFolderPath: vscode.Uri): string[] {
  const templateDirectories = fs
    .readdirSync(templatesFolderPath.fsPath, { withFileTypes: true })
    .map((dirent) => dirent.name);

  return templateDirectories;
}

// Esta funcion se llama para crear la estructura de carpetas
function createStructureFromTemplate(
  templatePath: vscode.Uri,
  destinationFolderPath: string,
  callback: () => void
) {
  let dirPath = templatePath.fsPath;
  const children = fs.readdirSync(dirPath, { withFileTypes: true });
  let index = 0;

  const processNextChild = () => {
    if (index >= children.length) {
      // Todos los archivos y carpetas se han procesado
      callback();
      return;
    }

    const child = children[index];
    const filePath = path.join(dirPath, child.name);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const newFilePath = path.join(destinationFolderPath, child.name);
      if (fs.existsSync(newFilePath)) {
        vscode.window
          .showQuickPick(["Reemplazar Archivo", "Omitir Archivo"], {
            placeHolder: `El archivo ${child.name} ya existe en esta ruta, Escoge una opción`,
          })
          .then((option) => {
            if (option === "Reemplazar Archivo") {
              fs.writeFileSync(newFilePath, fileContent);
              index++;
              processNextChild();
            } else {
              // Omitir Archivo
              index++;
              processNextChild();
            }
          });
      } else {
        fs.writeFileSync(newFilePath, fileContent);
        index++;
        processNextChild();
      }
    } else if (stats.isDirectory()) {
      const newFolderPath = path.join(destinationFolderPath, child.name);
      if (fs.existsSync(newFolderPath)) {
        // El folder ya existe en la carpeta de destino
        vscode.window
          .showQuickPick(["Reemplazar Folder", "Omitir este Folder"], {
            placeHolder: `El folder ${child.name} ya existe en esta ruta, Escoge una opción`,
          })
          .then((option) => {
            if (option === "Reemplazar Folder") {
              deleteFolderRecursive(newFolderPath);
              fs.mkdirSync(newFolderPath);
              createStructureFromTemplate(
                vscode.Uri.file(filePath),
                newFolderPath,
                () => {
                  index++;
                  processNextChild();
                }
              );
            } else {
              index++;
              processNextChild();
            }
          });
      } else {
        fs.mkdirSync(newFolderPath);
        createStructureFromTemplate(
          vscode.Uri.file(filePath),
          newFolderPath,
          () => {
            index++;
            processNextChild();
          }
        );
      }
    }
  };

  processNextChild();
}

// Función para copiar un archivo o carpeta a una ubicación específica
function convertFileOrFolderToTemplate(
  folderPathConvertToTemplate: string,
  name: string,
  templatesPath: vscode.Uri
): void {
  const stats = fs.statSync(folderPathConvertToTemplate);

  if (stats.isFile()) {
    // Si es un archivo, copia el archivo a la carpeta de destino
    let fileName = path.basename(folderPathConvertToTemplate);
    if (path.basename(templatesPath.fsPath) === "Templates" && name) {
      let partsFilename = fileName.split(".");
      fileName = name + "." + partsFilename[partsFilename.length - 1];
    }
    const destPath = path.join(templatesPath.fsPath, fileName);
    fs.copyFileSync(folderPathConvertToTemplate, destPath);
  } else if (stats.isDirectory()) {
    // Si es una carpeta, copia toda la carpeta a la carpeta de destino
    let folderName = path.basename(folderPathConvertToTemplate);
    if (path.basename(templatesPath.fsPath) === "Templates") {
      folderName = name || path.basename(folderPathConvertToTemplate);
    }
    let newTemplatePath = path.join(templatesPath.fsPath, folderName);
    fs.mkdirSync(newTemplatePath);
    fs.readdirSync(folderPathConvertToTemplate).forEach((child) => {
      const childUri = vscode.Uri.file(
        path.join(folderPathConvertToTemplate, child)
      );
      convertFileOrFolderToTemplate(
        childUri.fsPath,
        name,
        vscode.Uri.file(newTemplatePath)
      );
    });
  }
}

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
