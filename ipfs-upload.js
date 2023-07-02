const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { deployContract } = require('./deploy.js');
const { checkInputFolderOnlyImages } = require('./helpers.js')

async function _uploadFolder(folderPath, ipfsInstance, returnAll=false) {
    const form = new FormData();

    async function traverseDirectory(dirPath, parentPath = '') {
        const files = await fs.promises.readdir(dirPath);
    
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = await fs.promises.stat(filePath);
    
            if (stats.isFile()) {
                const fileStream = fs.createReadStream(filePath);
                const relativePath = path.join(parentPath, file);
    
                form.append('file', fileStream, {
                filename: encodeURIComponent(relativePath),
                filepath: `/${encodeURIComponent(relativePath)}`,
                contentType: 'application/octet-stream',
                });
            } else if (stats.isDirectory()) {
                const relativePath = path.join(parentPath, file);
                form.append('file', '', {
                filename: relativePath,
                filepath: `/${relativePath}`,
                contentType: 'application/x-directory',
                });
    
                await traverseDirectory(filePath, relativePath);
            }
        }
    }

    await traverseDirectory(folderPath);

    const ipfsEndpoint = ipfsInstance.endpoint;
    const ipfsAuth = ipfsInstance.auth;
    const response = await axios.post(ipfsEndpoint+"/api/v0/add", form, {
        params: {
            'wrap-with-directory': true,
            'cid-version': 1,
        },
        headers: {
            ...form.getHeaders(),
            Authorization: ipfsAuth
        }
    });

    const uploads = response.data.split('\n').filter((element) => element !== '');
    return returnAll ? uploads : JSON.parse(uploads[uploads.length-1]);
}

function _createJSONFromIPFS(jsonDirectory, assets) { 
    if(fs.existsSync(jsonDirectory)) {
        fs.rmSync(jsonDirectory, {recursive: true, force: true});
    }
    fs.mkdirSync(jsonDirectory, { recursive: true });

    const baseCID = JSON.parse(assets[assets.length-1]).Hash;
    //console.log(`DEBUG: Image base: ${baseCID}`);

    for(let i = 0; i < assets.length-1; i++) {
        let json = {};
        const asset = JSON.parse(assets[i]);
        const _path = asset.Name;
        const desc = _path.replace(/\.[^/.]+$/, ""); //trim file extension off
        
        json.tokenId = i.toString();
        json.name = desc;
        json.description = desc 
        json.image = `ipfs://${baseCID}/${_path}`;
    
        fs.writeFileSync(`${jsonDirectory}/${i}`, JSON.stringify(json, null, 2));
    }
}

async function uploadAndMint(folderPath, jsonPath, artifactPath, ipfsInstance, chainInstance) {
    try {
        const numImages = checkInputFolderOnlyImages(folderPath);
        const uploadedAssets = await _uploadFolder(folderPath, ipfsInstance, true);

        _createJSONFromIPFS(jsonPath, uploadedAssets);
        const uploadedJSON = await _uploadFolder(jsonPath, ipfsInstance);
        const baseURI = 'ipfs://' + uploadedJSON.Hash+ '/';

        const constructorArgs = ["Collection 10", "AMG", baseURI, numImages];
        const contractAddress = await deployContract(chainInstance, artifactPath, constructorArgs);
        return({ baseURI, contractAddress });
    } catch(error) {
        console.error(error.message)
        process.exitCode = 1;
    }
}

async function uploadOnly(folderPath, ipfsInstance) {
    try {
        const uri = await _uploadFolder(folderPath, ipfsInstance);
        return uri;
    } catch(error) {
        console.error(error.message);;
        process.exitCode = 1;
    }
}

module.exports = {
    uploadOnly,
    uploadAndMint
}


