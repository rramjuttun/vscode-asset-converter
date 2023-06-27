const vscode = require('vscode');
const { uploadOnly, uploadAndMint } = require('./ipfs-upload.js');
const { processDotenv, makePath } = require('./helpers.js');

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
	console.log('Congratulations, your extension "upload-extension" is now active!');
	
	let { ipfsEndpoint, ipfsAuth } = processDotenv();
	if(!ipfsEndpoint) {
		throw new Error('.env not found');
	}

	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.upload', 
		async function () {
			vscode.window.showInformationMessage('Uploading folder to IPFS.');
			const folderPath = makePath('./images');
			const upload = await uploadOnly(folderPath, ipfsEndpoint, ipfsAuth);
			console.log(`Folder Base URI: ipfs://${upload.Hash}`);
		})
	);
	
	context.subscriptions.push(vscode.commands.registerCommand('upload-extension.uploadAndMint', 
		async function () {
			vscode.window.showInformationMessage('Uploading folder to IPFS and deploying smart contract.');
			const folderPath = makePath('./images');
			const jsonPath = makePath('./json');
			const upload = await uploadAndMint(folderPath, jsonPath, ipfsEndpoint, ipfsAuth);
			console.log(`JSON Base URI: ipfs://${upload.Hash}`);
		})
	);
}

function deactivate() {}

module.exports = {
	activate,
	deactivate
}
