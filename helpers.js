const path = require('path');
const fs = require('fs-extra');
const dotenv = require('dotenv');

// Check if dotenv file exists in current workspace
function processDotenv(workspace) {
    let ipfsEndpoint, ipfsAuth
    const searchPath = path.join(workspace, '.env')

    if(searchPath && fs.existsSync(searchPath)) {
        dotenv.config({path: searchPath})
		ipfsEndpoint = process.env.IPFS_API_ENDPOINT;
		ipfsAuth = 'Basic ' + Buffer.from(process.env.IPFS_API_KEY + ':' + process.env.IPFS_API_KEY_SECRET).toString('base64');
    }

    const ipfsInstance = {
        endpoint: ipfsEndpoint,
        auth: ipfsAuth
    }

    const chainInstance = {
        nodeURI: process.env.ETH_NODE_URI,
        privateKey: process.env.PRIVATE_KEY
    }

    return({ ipfsInstance, chainInstance });
}

function checkArtifactDefault(sourcePath, workspace) {
    const targetPath = path.join(workspace, 'artifacts');
    if (!fs.existsSync(targetPath)) {
        fs.copySync(path.join(sourcePath, '/artifacts/contracts/SimpleERC721.sol'), targetPath);
    }
}

function checkInputFolderOnlyImages(folder) {
    const files = fs.readdirSync(folder);

    files.forEach((file) => {
        if (path.extname(file) != '.png') {
            throw new Error("The folder can only contain png files.")
        }
    });

    if(files.length > 0) {
        return(files.length);
    }
    else {
        throw new Error("Directory is empty");
    }
}

module.exports = {
    processDotenv,
    checkArtifactDefault,
    checkInputFolderOnlyImages
}