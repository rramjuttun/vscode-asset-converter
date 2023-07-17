const fs = require('fs');
const vscode = require('vscode');
const path = require('path')

function convertImports(text, editorFile, jsonPath) {
    const data = fs.readFileSync(jsonPath);
    const assetsJson = JSON.parse(data);

    // regex - import xyz from 'x/y/z.png
    const regex = /^(?!\/\/\s*)import\s+(\w+)\s+from\s+'([^']+\.(png))'/gm;

    /* Change import from relative to current file to relative to workspace
       example: if file being modified is 'src/game/a.js' and it contains
       'import x from ../assets/common/x.png' then the import path used for
       lookup should be 'src/assets/common/x.png' 

       Create json with folder as key and a list of every imported file 
       as the value. Example:
        import x from src/assets/common/x.png
        import y from src/assets/common/y.png

        imports = { src/assets/common: [ { x.png, x }, { y.png, y } ]		*/
    const imports = {}
    while((match = regex.exec(text)) !== null) {
        const codeLine = match[0]
        const importName = match[1];
        const filePath = match[2];
        
        const relativePath = vscode.workspace.asRelativePath(path.join(path.dirname(editorFile), filePath));
        const folder = path.dirname(relativePath);
        console.log(folder)

        // Check if the folder exists in the assets json file
        if(folder in assetsJson) {
            const fileEntry = { file: path.basename(relativePath), importName, codeLine}
            if(imports[folder]) {
                imports[folder].push(fileEntry);
            } else {
                imports[folder] = [fileEntry];
            }
        }
    }

    let gatewayFetch = ""
    const gateway = "gateway"
    const jsonName = "assets"
    for (const [folder, files] of Object.entries(imports)) {
        gatewayFetch += `const ${normalizeString(folder)} = ${gateway}.urlFromJsonEntry(${jsonName}, ${folder})\n`;
        for(const file of files){
            text = text.replace(file.codeLine, `let ${file.importName} = ${normalizeString(folder)}+'/${file.file}'`)
        }
    }
    console.log(gatewayFetch);
    return text;
}

// Normalize string to valid variable name
function normalizeString(s) {
	return s.replace(/\W/g, '_').replace(/^\d+/, '').replace(/\s+/g, '_');
}

module.exports = {
    convertImports
}