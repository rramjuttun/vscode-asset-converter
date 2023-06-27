const vscode = require('vscode');
const { uploadOnly, uploadAndMint } = require('./ipfs-upload.js');
const { processDotenv, makePath, checkArtifactDefault } = require('./helpers.js');

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
		async function () {
			vscode.window.showInformationMessage('Uploading folder to IPFS.');
			const folderPath = makePath('./images');
			const upload = await uploadOnly(folderPath, ipfsInstance);
			console.log(`Folder Base URI: ipfs://${upload.Hash}`);
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.uploadAndMint', 
		async function () {
			vscode.window.showInformationMessage('Uploading folder to IPFS and deploying smart contract.');
			const folderPath = makePath('./images');
			const jsonPath = makePath('./json');
			const upload = await uploadAndMint(folderPath, jsonPath, ipfsInstance, chainInstance);
		})
	);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
