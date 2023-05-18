// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "fast-folder-structure" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let createTemplate = vscode.commands.registerCommand('fast-folder-structure.createTemplate', () => {
		// vscode.window.showInformationMessage('Hora de crear una Plantilla fast-folder-structure!');
		// Ruta de la carpeta de plantillas
		const templatesFolderPath = vscode.Uri.joinPath(context.extensionUri, 'Templates');
		// Obtener nombres de las plantillas desde las carpetas dentro de la carpeta de plantillas
		const allTemplates: string[] = getTemplateNames(templatesFolderPath);

        vscode.window.showQuickPick(allTemplates, { placeHolder: 'Selecciona una plantilla' })
            .then(selectedTemplate => {
                if (selectedTemplate) {
					// Build the full path of the folder of a selected template.
					const templateFolderPath = vscode.Uri.joinPath(templatesFolderPath, selectedTemplate);

					const workspaceFolders = vscode.workspace.workspaceFolders;
					if (!workspaceFolders || workspaceFolders.length === 0) {
						vscode.window.showErrorMessage('No se ha abierto ninguna carpeta de trabajo.');
						return;
					}

					const rootPath = workspaceFolders[0].uri;
					const destinationFolderPath = path.join(rootPath.fsPath);

                    // Call method to create structure
					createStructureFromTemplate(templateFolderPath, destinationFolderPath);
					vscode.window.showInformationMessage('¡Felicitaciones! Has creado tu plantilla. ¡Let\'s Go!');
					
                }
            });
	});

	context.subscriptions.push(createTemplate);
}

// This method is called when your extension is deactivated
export function deactivate() {}



function getTemplateNames(templatesFolderPath: vscode.Uri): string[] {
    const templateDirectories = fs.readdirSync(templatesFolderPath.fsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    return templateDirectories;
}


// This method is called to create folders structure
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
