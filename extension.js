const vscode = require('vscode');
const { uploadOnly, uploadAndMint } = require('./ipfs-upload.js');
const { processDotenv, checkArtifactDefault, deleteFolder } = require('./helpers.js');
const path = require('path');
const { updateJson } = require('./save-json.js');
const { convertImports } = require('./convert-imports.js');
/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "upload-extension" is now active!');

	// Check that workspace is open
	//let workspacePath = checkWorkspace();
	
	// Look for .env file in workspace
	// let { ipfsInstance, chainInstance } = processDotenv(envPath);
	// if(!ipfsInstance.endpoint) {
	// 	throw new Error('.env not found');
	// }

	// Function to upload folder to IPFS. Can contain any file types and other folders too
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.upload', 
		async function (folderURI) {
			const workspacePath = checkWorkspace();
			const configs = loadConfig();

			const envPath = path.join(workspacePath, configs.env);
			const outputJsonPath = path.join(workspacePath, configs.json);
			const directory = path.relative(workspacePath, folderURI.path);

			const confirmation = await vscode.window.showInformationMessage(`Upload folder ./${directory} to IPFS?`, "Confirm", "Cancel");
			if(confirmation !== "Confirm") {
				return;
			}
			
			// Check /.env file
			const { ipfsInstance, _ } = processDotenv(envPath);
			if(!ipfsInstance.endpoint) {
				throw new Error('.env does not contain member IPFS_API_ENDPOINT');
			}

			vscode.window.showInformationMessage('Uploading folder to IPFS.');

			// Upload to IPFS and save directory and hash to json
			const upload = await uploadOnly(folderURI.path, ipfsInstance);
			console.log(`Folder URI: ipfs://${upload.Hash}`);
		
			const jsonEntry = {
				directory: directory,
				type: "common",
				hash: upload.Hash,
				uri: `/ipfs/${upload.Hash}`,
			}
		
			//console.log(outputJsonPath);
			updateJson(outputJsonPath, directory, jsonEntry);
			return upload.Hash;
		})
	);
	
	// Function to upload folder to IPFS and deploy a ERC721 contract associated with it. 
	// Folder can only contain png images and can not contain other folders
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.uploadAndMint', 
		async function(folderURI) {
			const workspacePath = checkWorkspace();
			const configs = loadConfig(true);

			const envPath = path.join(workspacePath, configs.env);
			const outputJsonPath = path.join(workspacePath, configs.json);
			const artifactPath = path.join(workspacePath, configs.artifact);
			const tempJsonPath = path.join(workspacePath, configs.tempJsonLoc);
			const directory = path.relative(workspacePath, folderURI.path);

			const confirmation = await vscode.window.showInformationMessage(`Upload folder ./${directory} to IPFS and Deploy ERC721 Smart Contract?`, "Confirm", "Cancel");
			if(confirmation !== "Confirm") {
				return;
			}

			vscode.window.showInformationMessage('Uploading folder to IPFS and deploying smart contract.');

			// Check /.env file
			const { ipfsInstance, chainInstance } = processDotenv(envPath);
			if(!ipfsInstance.endpoint) {
				throw new Error('.env does not contain member IPFS_API_ENDPOINT');
			}
			if(!chainInstance.nodeURI || !chainInstance.privateKey) {
				throw new Error('.env does not contain member ETH_NODE_URI or PRIVATE_KEY');
			}

			// Check if artifacts folder exists, otherwise copy it from extension 
			checkArtifactDefault(context.extensionPath, artifactPath);

			// Upload and deploy contract
			const folderPath = folderURI.path
			const { baseURI, contractAddress } = await uploadAndMint(folderPath, tempJsonPath, artifactPath, ipfsInstance, chainInstance);
			console.log(`JSON base URI: ${baseURI}`);
			console.log(`Contract deployed to address ${contractAddress}`)
		
			const jsonEntry = {
				directory: directory,
				type: "ownable",
				baseUri: baseURI,
				deployAddress: contractAddress
			}
			
			updateJson(outputJsonPath, directory, jsonEntry)

			if(configs.deleteJson) {
				deleteFolder(tempJsonPath);
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.testCommand', 
		async function(folderURI) {
			const configs = loadConfig(true);
			console.log(configs.deleteJson);
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.convertImports', 
		async function() {
			const workspacePath = checkWorkspace();
			const jsonFile = vscode.workspace.getConfiguration('upload-extension').output.jsonFile;
			if(!jsonFile.endsWith(".json")) {
				throw new Error("'Output: Json File' does not resolve to .json file");
			}

			const editor = vscode.window.activeTextEditor;
			const editorFile = editor.document.fileName

			const gatewayName = await vscode.window.showInputBox({
				prompt: "Enter the name of the Gateway object",
				value: "gateway",
			})
			
			if(!gatewayName) {
				return;
			}
			if(!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(gatewayName)) {
				throw new Error("Invalid gateway name provided.")
			}

			if(editor) {
				let text = editor.document.getText();
				const newText = convertImports(text, editorFile, path.join(workspacePath, jsonFile), gatewayName);
				
				const start = editor.document.lineAt(0);
				const end = editor.document.lineAt(editor.document.lineCount - 1);
				const textRange = new vscode.Range(start.range.start, end.range.end);

				editor.edit(editBuilder => {
					editBuilder.replace(textRange, newText);
				})
			}
			
			return;
		})
	);
}

function deactivate() {}

function checkWorkspace() {
	const workspaceFolders = vscode.workspace.workspaceFolders;
	if(!workspaceFolders || workspaceFolders.length == 0) {
		throw new Error('Workspace not found');
	}
	if(workspaceFolders.length != 1) {
		throw new Error('Only one workspace can be open');
	}
	return(workspaceFolders[0].uri.fsPath);
}

function loadConfig(nft=false) {
	const configPaths = vscode.workspace.getConfiguration('upload-extension');
	const env = configPaths.environment.envFile;
	const json = configPaths.output.jsonFile

	if(!env.endsWith(".env")) {
		throw new Error("'Environment: Env File' does not resolve to .env file");
	}
	if(!json.endsWith(".json")) {
		throw new Error("'Output: Json File' does not resolve to .json file");
	}
	
	if(!nft) {
		return({ env, json })
	}
	
	const artifact = configPaths.artifact.artifactFile;
	const tempJsonLoc = configPaths.temporary.jsonLocation;
	const deleteJson = configPaths.temporary.deleteTemporaryJsonAfterDeploy

	if(!artifact.endsWith(".json")) {
		throw new Error("'Artifact: Artifact File' does not resolve to .json file")
	}

	return( { env, json, artifact, tempJsonLoc, deleteJson });
}

module.exports = {
	activate,
	deactivate
}
