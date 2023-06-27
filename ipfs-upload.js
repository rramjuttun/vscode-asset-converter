const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const { deployContract } = require('./deploy.js');
const { checkInputFolderOnlyImages, makePath } = require('./helpers.js')

async function _uploadFolder(folderPath, ipfsInstance, returnAll=false) {
    try {
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

    } catch(error) {
        console.error('Error uploading to IPFS:', error);
    }
}

function _createJSONFromIPFS(jsonDirectory, assets) {
    if(fs.existsSync(jsonDirectory)) {
        fs.rmSync(jsonDirectory, {recursive: true, force: true});
    }
    fs.mkdirSync(jsonDirectory);

    const baseCID = JSON.parse(assets[assets.length-1]).Hash;
    //console.log(`DEBUG: Image base: ${baseCID}`);

    for(let i = 0; i < assets.length-1; i++) {
        let json = {};
        asset = JSON.parse(assets[i]);
        const _path = asset.Name;
        const desc = _path.replace(/\.[^/.]+$/, ""); //trim file extension off
        
        json.tokenId = i.toString();
        json.name = desc;
        json.description = desc 
        json.image = `ipfs://${baseCID}/${_path}`;
    
        fs.writeFileSync(`${jsonDirectory}/${i}`, JSON.stringify(json, null, 2));
    } 
}

async function uploadAndMint(folderPath, jsonPath, ipfsInstance, chainInstance) {
    const numImages = checkInputFolderOnlyImages(folderPath);
    const uploadedAssets = await _uploadFolder(folderPath, ipfsInstance, returnAll=true);

    _createJSONFromIPFS(jsonPath, uploadedAssets);
    const uploadedJSON = await _uploadFolder(jsonPath, ipfsInstance);
    const baseURI = 'ipfs://' + uploadedJSON.Hash+ '/';
    console.log(`JSON Base URI: ${baseURI}`);

    const artifactPath = makePath('artifacts/SimpleERC721.json')
    const constructorArgs = ["Collection 10", "AMG", baseURI, numImages];
    const contractAddress = await deployContract(chainInstance, artifactPath, constructorArgs);
    console.log(`Contract deployed to ${contractAddress}`);
    return(contractAddress);
}

async function uploadOnly(folderPath, ipfsInstance) {
    return((await _uploadFolder(folderPath, ipfsInstance)));
}

module.exports = {
    uploadOnly,
    uploadAndMint
}


