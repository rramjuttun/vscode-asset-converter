const fs = require('fs');
const path = require('path');

function readJson(jsonPath) {
    if(fs.existsSync(jsonPath)) {
        const jsonData = fs.readFileSync(jsonPath);
        return JSON.parse(jsonData)
    } 
    
    return {};  // Empty JSON if file does not exist
}

function writeJson(jsonPath, data) {
    const directoryPath = path.dirname(jsonPath);
    if (!fs.existsSync(directoryPath)) {
        console.log("Output json directory does not already exist. Will create it.")
        fs.mkdirSync(directoryPath, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), );
}

function updateJson(jsonPath, key, newEntry) {
    const existingJson = readJson(jsonPath);
    existingJson[key] = newEntry;
    writeJson(jsonPath, existingJson);
}

module.exports = {
    updateJson
}


