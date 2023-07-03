# Development Process Summary

This document summarizes my process and experience with developing the vscode-asset-converter extension. Mainly to be used as a reference in the future.  

All this information was obtained from the [VS Code API](https://code.visualstudio.com/api/references/vscode-api)

## Getting started

To get a project template, follow the instructions given here: [Your First Extension](https://code.visualstudio.com/api/get-started/your-first-extension).

```sh
npm install -g yo generator-code
yo code
```

## Running Extensions in a Test Environment 
* Press `F5` or go to `Run > Start Debugging` to launch extension development host. This opens a new instance of VS Code with the extension running in it.
* If you modify the file, either restart the extension development host or reload it with `Ctrl+R`
* Run commands using whatever available invocation method. By default they are available to run from the command palette (`Ctrl+Shift+P`) but this can be modified. In this extension, the commands are invoked from the context menu when right clicking on a folder (running the commands from the command palette is disabled). 
* To look at console output, look at the debug console (`Ctrl+Shift+Y`) of the original VS code instance (not the extension development host).

## Activation Functions

The main code for the extension is located in `extension.js`. It consists of an activation function which runs one time when the extension is first activated. In this case the extension will check the [workspace](https://code.visualstudio.com/api/references/vscode-api#workspace) and process the `.env` file upon activation.
```js
async function activate(context) {
	console.log('Congratulations, your extension "upload-extension" is now active!');

	const workspacePath = checkWorkspace();
	
	// Look for .env file in workspace
	let { ipfsInstance, chainInstance } = processDotenv(workspacePath);
	if(!ipfsInstance || !chainInstance) {
		throw new Error('.env not found or missing fields');
	}
}
```  
\
The `context` parameter is an instance of [ExtensionContext](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext) instance and provides some useful utilities for the extension.


[Activation events](https://code.visualstudio.com/api/references/activation-events) determine when the extension is activated. By leaving them empty, the extension will activate by default on the first time any command is run. The activation events are specified within `package.json`:  
```json
{
    "activationEvents": []
}
```  

## User Interaction
For UI elements to show messages, selections, and asking for user input, VC Code uses the [window](https://code.visualstudio.com/api/references/vscode-api#window) namespace. For example, using `vscode.window.showInformationMessage` will show a message box to the user. 

## Commands

VS Code extensions mainly revolve around [commands](https://code.visualstudio.com/api/references/vscode-api#commands). Commands are functions that are triggered from the UI that accomplish various tasks or operations within VS Code. 

### Creating commands 

Commands are declared in `package.json` and are implemented in `extension.js`. For example, the command used to upload a folder to IPFS is defined in `package.json` as

```json
{
  "contributes": {
    "commands": [
      {
        "command": "upload-extension.upload",
        "title": "Upload to IPFS"
      }
    ]
  }
}
```
\
The function is implemented using the `registerCommand` function in the activate function in `extension.js`
```js
async function activate(context) {
    // Activation code

    context.subscriptions.push(vscode.commands.registerCommand('upload-extension.upload', 
    	async function (folderURI) {
    		vscode.window.showInformationMessage('Uploading folder to IPFS.');
    
    		// Upload to IPFS and save directory and hash to json
    		const upload = await uploadOnly(folderURI.path, ipfsInstance);
    		
    		//Rest of code
    	})
    );
}
```
`registerCommand` registers a command that can be invoked through the UI. It returns a [disposable](https://code.visualstudio.com/api/references/vscode-api#Disposable) which is then added to the `subscriptions` property of
[context](https://code.visualstudio.com/api/references/vscode-api#ExtensionContext) which will unregister the command when the extension is deactivated. 

### Invoking commands

After registering commands, by default they will be available to run in the command palette `Ctrl+Shift+P`. Other ways of invoking them are set with contributes. Options for contributes include [menus](https://code.visualstudio.com/api/references/contribution-points#contributes.menus) (menu bar, right-click menu, etc...) and [keybinds](https://code.visualstudio.com/api/references/contribution-points#contributes.keybindings) (keyboard shortcuts). contributes are set the `package.json` (the same place as where the commands were declared before).

```json
{
  "contributes": {
    "commands": [
      {
        "command": "upload-extension.upload",
        "title": "Upload to IPFS"
      }
    ],
    "menus": {
      "explorer/context": [
        {
          "command": "upload-extension.upload",
          "when": "resourceScheme == 'file' && explorerResourceIsFolder"
        }
      ],
      "commandPalette": [
        {
          "command": "upload-extension.upload",
          "when": "false"
        }   
      ]
    }
  }
}
```
In this extension, I want the `upload-extension.upload` command to be a button on the context menu when a folder is right clicked. This is accomplished by adding the command to the the explorer context menu `explorer/context` whenever the selected resource is a folder. The list of possible when clauses is located [here](https://code.visualstudio.com/api/references/when-clause-contexts)

When a command is invoked from the explorer context menu, it gets passed the URI of the selected file/folder as an argument. However, when called from the command palette (where it is always shown by default), no arguments are passed to it and the command will throw an error since it requires the folder URI as an input. To account for this, the command is hidden from the command palette menu using `"when": "false"`.

## Testing Extensions 

A lot of useful informaion for testing extensions can be found in [VS Code's documentaion](https://code.visualstudio.com/api/working-with-extensions/testing-extension) for extension testing. 

### Creating tests
The sample project comes with a mocha test suite and a test runner configuration. This can easily be modified to test the extension under development. The tests are located in `test/suite/extension.test.js`. Other files can also be added to this folder as long as they end in `.test.js` but for this extension I just modified `extention.test.js`

```js
suite('Extension Test Suite', () => {
	before(() => {
		vscode.window.showInformationMessage('Start all tests.');
	});

	test('Test upload-extension.upload command', async () => {
		// Images contains 10 images 
		const imagesFolder = path.join(vscode.workspace.workspaceFolders[0].uri.fsPath, '/images');
		const folderUri = vscode.Uri.file(imagesFolder);

		const uploaded = await vscode.commands.executeCommand('upload-extension.upload', folderUri);

		assert.strictEqual(uploaded, 'bafybeibsxhin2shpkokl3kdohwtsscqkmc6gclgiluong3spicw5ea4neq');
	}).timeout(10000);
});
```
This is a simple test that tests the upload of a folder to IPFS and then checks that its CID hash is as expected. For testing purposes, commands can be executed manually using `vscode.commands.executeCommand` and outputs can be captured and asserted against.

### Running tests
There are two options for running the tests, both will run the all tests in `tests/suite`

1. Use `npm run test`. This will run the tests using the `test/runTest.js` script.\
\
If you would want the extension tests to run in a particular workspace, add the path to that folder as the first element of launchArgs as shown below.
    ```js
    async function main() {
    	try {
    		//Rest of code
    		const workspaceFolder = path.join(__dirname, './workspace')
    		await runTests({ extensionDevelopmentPath, extensionTestsPath, launchArgs:[workspaceFolder] });
    	} catch (err) {
    		// Rest of code
    	}
    }
    ```


2. Use the debugger. Go to the `Run and Debug` menu in VS Code (`Ctrl+Shift+D`) and change the configuration from `Run Extension` to `Extension Tests`. This will do the tests using the `Extension Tests` configuration located in `.vscode/launch.json` To run the configuration, press the green button beside the configuration name or press `F5` to start the debugger. Note that this will change the behaviour of `F5` and it will now run the tests instead of opening extension development host. If you would like it to open extension development host then change the configuration back to `Run Tests`\
\
If you would want the extension tests to run in a particular workspace, add the path to that folder as the first argument in the configuration in `launch.json` as shown below. More information is given in the documentation linked above.
    ```json
    {
        "configurations": [
    		{
    			"name": "Extension Tests",
    			"type": "extensionHost",
    			"request": "launch",
    			"args": [
    				"${workspaceFolder}/test/workspace",
    				"--extensionDevelopmentPath=${workspaceFolder}",
    				"--extensionTestsPath=${workspaceFolder}/test/suite/index"
    			]
    		}
        ]
    }
    ```

















