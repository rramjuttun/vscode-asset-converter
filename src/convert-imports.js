const fs = require('fs');
const vscode = require('vscode');
const path = require('path')

function convertImports(text, editorFile, jsonPath, gateway) {
    const data = fs.readFileSync(jsonPath);
    const assetsJson = JSON.parse(data);

    // regex: import xyz from 'x/y/z.png
    const regex = /^(?!\/\/\s*)import\s+(\w+)\s+from\s+['"]([^'"]+\.(png))['"]/gm;

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

    let newCode = ""
    let jsonName;
    const inputJsonName = false;
    if(!inputJsonName) {
        // Path of assets json relative to the editor file
        const jsonImportPath = path.relative(path.dirname(editorFile), jsonPath);

        // Check if the json file is already imported, if it is use it as jsonName, otherwise import it using the file name as the jsonName
        const re = new RegExp(`^(?!\/\/\\s*)import\\s+(\\w+)\\s+from\\s+['"]${jsonImportPath.replace(/\//g, '\\/')}['"]`);
        const match = re.exec(text);
        if(match) {
            jsonName = match[1];
        } else {
            jsonName = normalizeString(path.basename(jsonPath, '.json'));
            newCode += `import ${jsonName} from '${jsonImportPath}'\n`
        }
    } else {
        //TODO
        jsonName = 'assets';
    }

    for (const [folder, files] of Object.entries(imports)) {
        switch(assetsJson[folder].type) {
            // Common assets can be handled directly in IPFS
            // case "common":
            //     newCode += `const ${normalizeString(folder)} = await ${gateway}.urlFromJsonEntry(${jsonName}, "${folder}")\n`;
            //     for(const file of files){
            //         newCode += `let ${file.importName} = ${normalizeString(folder)}+'/${file.file}'`
            //         text = text.replace(file.codeLine, newCode);
            //         newCode = "";
            //     }
            //     break;
            case "ownable":
                newCode += `let ${files[0].importName} = await ${gateway}.urlFromJsonEntry(${jsonName}, "${folder}")`;
                text = text.replace(files[0].codeLine, newCode);
                newCode = "";
                break;
            default:
                break;      
        }
    }
    return text;
}

// Normalize string to valid variable name
function normalizeString(s) {
	return s.replace(/\W/g, '_').replace(/^\d+/, '').replace(/\s+/g, '_');
}

module.exports = {
    convertImports
}