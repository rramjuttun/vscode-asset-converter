const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function _uploadFolder(folderPath, ipfsEndpoint, ipfsAuth, returnAll=false) {
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

    } catch (error) {
        console.error('Error uploading folder:', error);
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

async function uploadAndMint(folderPath, jsonPath, ipfsEndpoint, ipfsAuth) {
    const uploadedAssets = await _uploadFolder(folderPath, ipfsEndpoint, ipfsAuth, returnAll=true);
    _createJSONFromIPFS(jsonPath, uploadedAssets);
    const uploadedJSON = await _uploadFolder(jsonPath, ipfsEndpoint, ipfsAuth);
    return(uploadedJSON)
}

async function uploadOnly(folderPath, ipfsEndpoint, ipfsAuth) {
    return((await _uploadFolder(folderPath, ipfsEndpoint, ipfsAuth)));
}

//uploadAndMint("./images", "http://127.0.0.1:5001", "");

module.exports = {
    uploadOnly,
    uploadAndMint
}


