// El módulo 'vscode' contiene la API de extensibilidad de VS Code
// Importa el módulo y haz referencia a él con el alias 'vscode' en tu código a continuación
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { log } from "console";

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

  // Esta línea de código se ejecutará solo una vez cuando tu extensión se active
  vscode.window.showInformationMessage(
    "Fast Folder Structure ahora está activa"
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
        try {
          if (
            convertFileOrFolderToTemplate(
              resource.fsPath,
              name,
              templatesFolderPath
            ) !== "FoundResourceName"
          ) {
            vscode.window.showInformationMessage(
              "¡Felicitaciones, acabas de crear una plantilla!"
            );
          }
        } catch (error) {
          vscode.window.showInformationMessage(
            "Ha ocurrido un error al Convertir a Plantilla"
          );
        }
      }
    }
  );

  context.subscriptions.push(selectTemplate, convertToTemplate);
}

// Esta función se llama cuando tu extensión se desactiva
export function deactivate() {}

/**
 * Muestra el cuadro de selección rápida para que el usuario elija una plantilla
 * @param templatesFolderPath - Ruta donde se guardan las plantillas de la extension
 * @param destinationFolderPath - Ruta donde de destino
 */
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
        createStructureFromTemplate(
          templateFolderPath,
          destinationFolderPath,
          () => {
            vscode.window.showInformationMessage(
              "¡Felicitaciones! Has creado tu plantilla."
            );
          }
        );
      }
    });
}

// Obtiene los nombres de las plantillas desde las carpetas dentro de la carpeta de plantillas
/**
 *
 * @param templatesFolderPath - Ruta donde se guardan las plantillas de la extension
 * @returns {string[]} - array de strings con los nombres de las plantillas disponibles
 */
function getTemplateNames(templatesFolderPath: vscode.Uri): string[] {
  const templateDirectories = fs
    .readdirSync(templatesFolderPath.fsPath, { withFileTypes: true })
    .map((dirent) => dirent.name);

  return templateDirectories;
}

/**
 * Esta función se llama para crear la estructura de carpetas
 * @param templatePath - Ruta donde se guardan las plantilla de la extension
 * @param destinationFolderPath - Ruta en donde se creara el contenido de la plantilla seleccionada
 * @param callback - Funcion que se llama al crear todos los recursos de la plantilla
 */
function createStructureFromTemplate(
  templatePath: vscode.Uri,
  destinationFolderPath: string,
  callback: () => void
) {
  // Obtener el valor de la propiedad para saber si desea reemplazar, omitir o preguntar sobre que hacer con los recursos que ya existen desde la configuración
  const replaceOption = vscode.workspace
    .getConfiguration("fast-folder-structure")
    .get("ReplaceFileOrFolderExistents");

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
      if (fs.existsSync(newFilePath) && replaceOption === "Preguntar") {
        vscode.window
          .showQuickPick(["Reemplazar Archivo", "Omitir Archivo"], {
            placeHolder: `El archivo ${child.name} ya existe en esta ruta. Escoge una opción.`,
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
      } else if (replaceOption === "Omitir") {
        // Omitir Archivo
        index++;
        processNextChild();
      } else {
        fs.writeFileSync(newFilePath, fileContent);
        index++;
        processNextChild();
      }
    } else if (stats.isDirectory()) {
      const newFolderPath = path.join(destinationFolderPath, child.name);
      if (fs.existsSync(newFolderPath) && replaceOption === "Preguntar") {
        // El folder ya existe en la carpeta de destino
        vscode.window
          .showQuickPick(["Reemplazar Folder", "Omitir este Folder"], {
            placeHolder: `El folder ${child.name} ya existe en esta ruta. Escoge una opción.`,
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
              // Omitir Folder
              index++;
              processNextChild();
            }
          });
      } else if (replaceOption === "Omitir") {
        // Omitir Folder
        index++;
        processNextChild();
      } else {
        if (replaceOption === 'Siempre') {
          deleteFolderRecursive(newFolderPath);
        }
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

/**
 * Función para copiar un archivo o carpeta a una ubicación específica
 * @param folderPathConvertToTemplate - Folder que el usuario convertira a una plantilla
 * @param name - Para darle un nombre a la plantilla
 * @param templatesPath - Ruta donde se guardan todas las plantillas de la extension
 * @returns {string | undefined} - La cadena de texto 'FoundResourceName' si existe una plantilla con el mismo nombre o undefined
 */
function convertFileOrFolderToTemplate(
  folderPathConvertToTemplate: string,
  name: string,
  templatesPath: vscode.Uri
) {
  const stats = fs.statSync(folderPathConvertToTemplate);
  let resourceName = path.basename(folderPathConvertToTemplate);

  if (
    path.basename(templatesPath.fsPath) === "Templates" &&
    fs.existsSync(
      path.join(templatesPath.fsPath, (name && isSpace(name)) || resourceName)
    )
  ) {
    console.log(`Ya existe una plantilla con el nombre ${resourceName}`);
    return "FoundResourceName";
  }

  if (stats.isFile()) {
    // Si es un archivo, copia el archivo a la carpeta de destino
    const destPath = path.join(templatesPath.fsPath, resourceName);
    fs.copyFileSync(folderPathConvertToTemplate, destPath);
  } else if (stats.isDirectory()) {
    // Si es una carpeta, copia toda la carpeta a la carpeta de destino
    if (path.basename(templatesPath.fsPath) === "Templates") {
      resourceName = (name && isSpace(name)) || resourceName;
    }
    let newTemplatePath = path.join(templatesPath.fsPath, resourceName);
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

/**
 * Elimina de forma recursiva una carpeta y todos sus contenidos.
 * @param folderPath - La ruta de la carpeta a eliminar.
 */
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

/**
 * Verifica si una cadena de texto está compuesta únicamente por espacios en blanco.
 * @param {string} str - La cadena de texto a verificar.
 * @returns {string | undefined} - La cadena de texto sin espacios en blanco o undefined si la cadena está compuesta solo por espacios.
 */
function isSpace(str: string) {
  let longStr = str.trim().length === 0;
  if (longStr) {
    return undefined;
  }

  return str.trim();
}
