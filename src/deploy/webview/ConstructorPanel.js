const vscode = require("vscode");

class ConstructorPanel {

    //Track the currently panel. Only allow a single panel to exist at a time.
    static currentPanel
    static viewType = "constructor";

    constructor(panel, extensionUri, constructorABI, overrides) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._disposables = [];

        // Set the webview's initial html content
        this._update(constructorABI, overrides);

        // Listen for when the panel is disposed
        // This happens when the user closes the panel or when the panel is closed programatically
        this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    static create(extensionUri, constructorABI, overrides={}) {
        // Delete the current panel if one already exists
        if (ConstructorPanel.currentPanel) {
            this._panel.dispose();
        }

        // Create a new panel.
        const panel = vscode.window.createWebviewPanel(
            ConstructorPanel.viewType,
            "Deploy",
            vscode.ViewColumn.Beside,
            {
                // Enable javascript in the webview
                enableScripts: true,
                retainContextWhenHidden: true,
                // And restrict the webview to only loading content from our extension's `media` directory.
                localResourceRoots: [
                    vscode.Uri.joinPath(extensionUri, "src/deploy/webview"),
                ],
            }
        );

        ConstructorPanel.currentPanel = new ConstructorPanel(panel, extensionUri, constructorABI, overrides);
        return(ConstructorPanel.currentPanel);
    }

    static kill() {
        ConstructorPanel.currentPanel?.dispose();
        ConstructorPanel.currentPanel = undefined;
    }

    dispose() {
        ConstructorPanel.currentPanel = undefined;

        // Clean up our resources
        this._panel.dispose();

        while(this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    async _update(constructorABI, overrides) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, constructorABI, overrides);

        webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case "onInfo": {
                if (!data.value) {
                    return;
                }
                vscode.window.showInformationMessage(data.value);
                break;
                }
                case "onError": {
                if (!data.value) {
                    return;
                }
                vscode.window.showErrorMessage(data.value);
                break;
                }
            }
        });
    }

    _getHtmlForWebview(webview, constructorArgs, overrides) {
        // Add the uri we use to load this script in the webview
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src/deploy/webview", "form.js")
        );

        // Uri to load styles into webview. Using local path to css styles
        const stylesResetUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src/deploy/webview/media", "reset.css")
        );
        const stylesMainUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "src/deploy/webview/media", "vscode.css")
        );

        // Use a nonce to only allow specific scripts to be run
        const nonce = getNonce();

        // Create form elements for each required constructor argument
        let formElements = ""
        constructorArgs.forEach(input => {
            let override = "";
            for(const regexString in overrides.regex) {
                const re = new RegExp(regexString, "i");
                if(re.test(input.name)) {
                    override = overrides.regex[regexString];
                    break;
                }
            }

            formElements += `
                <label for="${input.name}">${input.name} (type: ${input.type}):</label>
                <input type="${input.type}" name="${input.name}" ${override ? `value="${override}"` : `placeholder="Enter ${input.name}"`}><br>
            `;
        });

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <!--
                    Use a content security policy to only allow loading images from https or from our extension directory,
                    and only allow scripts that have a specific nonce.
                -->
                <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${stylesResetUri}" rel="stylesheet">
                <link href="${stylesMainUri}" rel="stylesheet">
                <link href="" rel="stylesheet">
                <script nonce="${nonce}">
                </script>
            </head>
            <body>
                <h1>Constructor Parameters</h1>
                <form id="constructorForm">
                    ${formElements}
                    <button type="submit" id="submitButton">Submit</button>
            </body>
            <script src=${scriptUri} nonce="${nonce}"> 
        </html>`;
    }
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

module.exports = {
    ConstructorPanel
}