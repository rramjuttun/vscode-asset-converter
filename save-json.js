const fs = require('fs');

// Function to read the data from the JSON file
function readJson(jsonPath) {
    if(fs.existsSync(jsonPath)) {
        const jsonData = fs.readFileSync(jsonPath);
        return JSON.parse(jsonData)
    } 
    
    return {};  // Empty JSON if file does not exist
}

function writeJson(jsonPath, data) {
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


