const vscode = require('vscode');
const { uploadOnly, uploadAndMint } = require('./ipfs-upload.js');
const { processDotenv, checkArtifactDefault } = require('./helpers.js');
const path = require('path');
const { updateJson } = require('./save-json.js')

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "upload-extension" is now active!');

	// Check that workspace is open
	const workspacePath = checkWorkspace();
	
	// Look for .env file in workspace
	let { ipfsInstance, chainInstance } = processDotenv(workspacePath);
	if(!ipfsInstance.endpoint) {
		throw new Error('.env not found');
	}

	// Function to upload folder to IPFS. Can contain any file types and other folders too
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.upload', 
		async function (folderURI) {
			vscode.window.showInformationMessage('Uploading folder to IPFS.');

			// Upload to IPFS and save directory and hash to json
			const upload = await uploadOnly(folderURI.path, ipfsInstance);
			console.log(`Folder URI: ipfs://${upload.Hash}`);
			const directory = path.relative(workspacePath, folderURI.path)
			const jsonEntry = {
				directory: directory,
				type: "common",
				hash: upload.Hash,
				uri: `/ipfs/${upload.Hash}`,
			}
		
			updateJson(path.join(workspacePath, "/test.json"), directory, jsonEntry);
			return upload.Hash;
		})
	);
	
	// Function to upload folder to IPFS and deploy a ERC721 contract associated with it. 
	// Folder can only contain png images and can not contain other folders
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.uploadAndMint', 
		async function(folderURI) {
			vscode.window.showInformationMessage('Uploading folder to IPFS and deploying smart contract.');

			// Check if artifacts folder exists, otherwise copy it from extension 
			checkArtifactDefault(context.extensionPath, workspacePath);

			const folderPath = folderURI.path
			const jsonPath = path.join(workspacePath, './json', path.basename(folderPath));
			const artifactPath = path.join(workspacePath, '/artifacts/SimpleERC721.json')
			const { baseURI, contractAddress } = await uploadAndMint(folderPath, jsonPath, artifactPath, ipfsInstance, chainInstance);
			console.log(`JSON base URI: ${baseURI}`);
			console.log(`Contract deployed to address ${contractAddress}`)
		
			const directory = path.relative(workspacePath, folderURI.path)
			const jsonEntry = {
				directory: directory,
				type: "ownable",
				baseUri: baseURI,
				deployAddress: contractAddress
			}

			updateJson(path.join(workspacePath, "/test.json"), directory, jsonEntry)
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.testCommand', 
		function(folderURI) {
			console.log(folderURI);
			console.log(process.versions)
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

module.exports = {
	activate,
	deactivate
}
