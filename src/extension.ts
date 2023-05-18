// El módulo 'vscode' contiene la API de extensibilidad de VS Code
// Importa el módulo y haz referencia a él con el alias 'vscode' en tu código a continuación
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


// Este método se llama cuando tu extensión se activa
// Tu extensión se activa la primera vez que se ejecuta el comando
export function activate(context: vscode.ExtensionContext) {

	// IDs constantes
	const createTemplateComandId = 'fast-folder-structure.createTemplate';

	// Utiliza la consola para imprimir información de diagnóstico (console.log) y errores (console.error)
	// Esta línea de código se ejecutará solo una vez cuando tu extensión se active
	console.log('¡Felicitaciones, tu extensión "fast-folder-structure" está activa ahora!');

	// El comando se ha definido en el archivo package.json
	// Ahora proporciona la implementación del comando con registerCommand
	// El parámetro commandId debe coincidir con el campo command en package.json
	let createTemplate = vscode.commands.registerCommand(createTemplateComandId, (resource: vscode.Uri) => {
		// Ruta de la carpeta de plantillas
		const templatesFolderPath = vscode.Uri.joinPath(context.extensionUri, 'Templates');

		// Comprueba si el recurso es válido y su esquema es "file".
		// Luego, path.basename se utiliza para obtener el nombre de la carpeta a partir de la ruta completa.
		if (resource && resource.scheme === 'file') {
			var destinationFolderPath = resource.fsPath;
			showQuickPick(templatesFolderPath, destinationFolderPath);
		} else {
			const workspaceFolders = vscode.workspace.workspaceFolders;
			if (!workspaceFolders || workspaceFolders.length === 0) {
				vscode.window.showErrorMessage('No se ha abierto ninguna carpeta de trabajo.');
				return;
			}

			const rootPath = workspaceFolders[0].uri;
			var destinationFolderPath = path.join(rootPath.fsPath);
			showQuickPick(templatesFolderPath, destinationFolderPath);
		}
	});

	context.subscriptions.push(createTemplate);
}

// Esta funcion se llama cuando tu extensión se desactiva
export function deactivate() {}

// Muestra el cuadro de selección rápida para que el usuario elija una plantilla
function showQuickPick(templatesFolderPath: vscode.Uri, destinationFolderPath: string) {
	const allTemplates: string[] = getTemplateNames(templatesFolderPath);
	vscode.window.showQuickPick(allTemplates, { placeHolder: 'Selecciona una plantilla' })
	.then(selectedTemplate => {
		if (selectedTemplate) {
			// Construye la ruta completa de la carpeta de una plantilla seleccionada
			const templateFolderPath = vscode.Uri.joinPath(templatesFolderPath, selectedTemplate);

			// Llama a la funcion para crear la estructura utilizando la plantilla seleccionada y la carpeta de destino
			createStructureFromTemplate(templateFolderPath, destinationFolderPath);
			vscode.window.showInformationMessage('¡Felicitaciones! Has creado tu plantilla. ¡Let\'s Go!');
		}
	});
}

// Obtiene los nombres de las plantillas desde las carpetas dentro de la carpeta de plantillas
function getTemplateNames(templatesFolderPath: vscode.Uri): string[] {
	const templateDirectories = fs.readdirSync(templatesFolderPath.fsPath, { withFileTypes: true })
		.filter(dirent => dirent.isDirectory())
		.map(dirent => dirent.name);

	return templateDirectories;
}

// Esta funcion se llama para crear la estructura de carpetas
function createStructureFromTemplate(templateFolderPath: vscode.Uri, destinationFolderPath: string) {
	const templateFiles = fs.readdirSync(templateFolderPath.fsPath, { withFileTypes: true });

	templateFiles.forEach(file => {
		const filePath = path.join(templateFolderPath.fsPath, file.name);
		const stats = fs.statSync(filePath);

		if (stats.isFile()) {
			const fileContent = fs.readFileSync(filePath, 'utf-8');
			const newFilePath = path.join(destinationFolderPath, file.name);

			fs.writeFileSync(newFilePath, fileContent);
		} else if (stats.isDirectory()) {
			const newFolderPath = path.join(destinationFolderPath, file.name);
			fs.mkdirSync(newFolderPath);

			createStructureFromTemplate(vscode.Uri.file(filePath), newFolderPath);
		}
	});
}
