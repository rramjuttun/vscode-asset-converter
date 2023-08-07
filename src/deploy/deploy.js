const fs = require('fs');
const { Web3 } = require('web3');
const { getConstructorArgs } = require("./webview/runWebview.js")


async function deployContract(extensionUri, ethInstance, artifactPath, overrides={}) {
    const json = JSON.parse(fs.readFileSync(artifactPath));
    const abi = json.abi;
    if(!Array.isArray(abi)) {
        throw new Error("Invalid ABI")
    }

    let bytecode;
    if(json.bytecode) {
        bytecode = json.bytecode
    } else if((json.data.bytecode.object)) {
        bytecode = json.data.bytecode.object; 
    } else {
        throw new Error("No bytecode found in artifact")
    }

    if(bytecode.startsWith('0x')) {
        bytecode = bytecode.slice(2);
    }

    const constructorABI = abi.find((abi) => abi.type === "constructor")
    let constructorArgs = [];

    if(constructorABI) {
        constructorArgs =  await(getConstructorArgs(constructorABI.inputs, extensionUri, overrides));
        if(overrides) {
            constructorArgs.forEach((element, index, array) => {
                if(element in overrides.mappings) {
                    array[index] = overrides.mappings[element];
                }
            });
        }
    }
    const web3 = new Web3(ethInstance.nodeURI);

    let privateKey = ethInstance.privateKey;
    if(!privateKey.startsWith('0x')) {
        privateKey = '0x' + privateKey; // add leading 0x
    } 

    const account = web3.eth.accounts.privateKeyToAccount(privateKey);
    web3.eth.accounts.wallet.add(account);

    const contract = new web3.eth.Contract(abi);
    const deployTx = contract.deploy({
        data: bytecode,
        arguments: constructorArgs,
    });

    const deployedContract = await deployTx.send({
        from: account.address,
        gas: 4000000,
    });

    return(deployedContract.options.address);
}

module.exports = {
    deployContract
}
