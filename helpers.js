const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Check if dotenv file exists in current workspace
function processDotenv(workspace) {
    let ipfsEndpoint, ipfsAuth
    const searchPath = makePath('.env')

    if(searchPath && fs.existsSync(searchPath)) {
        dotenv.config({path: searchPath})
		ipfsEndpoint = process.env.IPFS_API_ENDPOINT;
		ipfsAuth = 'Basic ' + Buffer.from(process.env.IPFS_API_KEY + ':' + process.env.IPFS_API_KEY_SECRET).toString('base64');
    }

    return({ ipfsEndpoint, ipfsAuth });
}

function makePath(relativePath) {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if(workspaceFolders && workspaceFolders.length > 0) {
        const workspacePath = workspaceFolders[0].uri.fsPath;
        return(path.join(workspacePath, relativePath))
    }
    return(null);
}

module.exports = {
    processDotenv,
    makePath
}