const assert = require('assert');
const { before } = require('mocha');
const path = require('path');
const vscode = require('vscode');
// const myExtension = require('../extension');

suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Test upload-extension.upload command', async () => {
		// Images contains 10 images 
		const imagesFolder = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '/images');
		const folderUri = vscode.Uri.file(imagesFolder);

		const uploaded = await vscode.commands.executeCommand('upload-extension.upload', folderUri);

		assert.strictEqual(uploaded, 'bafybeibsxhin2shpkokl3kdohwtsscqkmc6gclgiluong3spicw5ea4neq');
	}).timeout(10000);
});
