const vscode = require('vscode');
const { uploadOnly, uploadAndMint } = require('./ipfs-upload.js');
const { processDotenv, makePath, checkArtifactDefault } = require('./helpers.js');
const path = require('path');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "upload-extension" is now active!');
	
	let { ipfsInstance, chainInstance } = processDotenv();
	if(!ipfsInstance.endpoint) {
		throw new Error('.env not found');
	}

	checkArtifactDefault(context.extensionPath);

	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.upload', 
		async function (folderURI) {
			vscode.window.showInformationMessage('Uploading folder to IPFS.');
			const upload = await uploadOnly(folderURI.path, ipfsInstance);
			console.log(`Folder URI: ipfs://${upload.Hash}`);
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.uploadAndMint', 
		async function (folderURI) {
			//vscode.window.showInformationMessage('Uploading folder to IPFS and deploying smart contract.');
			const folderPath = folderURI.path
			const jsonPath = makePath(path.join('./json', path.basename(folderPath)));
			const upload = await uploadAndMint(folderPath, jsonPath, ipfsInstance, chainInstance);
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.testCommand', 
		function(folderURI) {
			console.log(folderURI.path);
		})
	);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
