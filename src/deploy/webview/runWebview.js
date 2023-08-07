const vscode = require('vscode');
const { ConstructorPanel } = require('./ConstructorPanel')

/*
 * Opens a webview to get constructor arguments from the user. Returns an array of constructor arguments or null if the window is closed. 
 * Does not typecheck
*/
async function getConstructorArgs(constructorABI, extensionUri, overrides={}) {
    if(!Array.isArray(constructorABI)) {
        throw new Error("Invalid Constructor ABI");
    }
    if(constructorABI.length == 0 ) {
        return([])
    }

    panelObject = ConstructorPanel.create(extensionUri, constructorABI, overrides);

    const constructorArgsPromise = new Promise(resolve => {
        panelObject._panel.webview.onDidReceiveMessage(message => {
            switch(message.type) {
                case "constructorArgs":
                    resolve(message.data);
                    panelObject.dispose();
                    break;
                case "invalidInput":
                    vscode.window.showWarningMessage("Please fill in all fields")
                    break;
            }
        });
        panelObject._panel.onDidDispose(() => {
            reject(null);
        });
    });

    const constructorArgs = await(constructorArgsPromise);
    return(constructorArgs);
}

module.exports = {
    getConstructorArgs,
}