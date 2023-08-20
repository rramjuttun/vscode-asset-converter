# IPFS and NFT Extension for VS Code

A VS Code extension for uploading project resources to IPFS and creating NFT Collections from them. Its main purpose is to help onboard game developers to the Web3 stack by providing a way to transition assets from traditional centralized storage to a decentralized environment and to simplify the process of deploying a project to IPFS.

The project management page for this extension is [here](https://github.com/users/rramjuttun/projects/1).
\
The design document for the extension is here [here](https://github.com/rramjuttun/vscode-asset-converter/blob/main/docs/designdoc.md).
## Features
* Upload directories to IPFS 

* Create and deploy NFT collections from asset folders

## Requirements and Installation

#### Note on Requirements
The extension currently only works in a development environment since it has not yet been published. When running as developer, use Node.js `v18.13.0` or `v16.17.1`. Other versions may also work but I have tested and confirmed it working with these two. 

Once published, the Node version will not matter when using the extension since VS code uses its own runtime instance (currently `v16.17.1`).

#### Install
Clone repo
```sh
git clone https://github.com/rramjuttun/vscode-asset-converter.git
```
Install dependencies
```sh
cd vscode-asset-converter
npm install
```

## Setup and Configuration

Once installed, press `F5` to start the extension development host or go to `Run > Start Debugging` in the menu bar. This will open up a new VS Code instance with the extension running in it. Open any folder within this instance to use as the workspace.

### Environment file
Create a `.env` file in the workspace or add the following to your existing file if one already exists. A `.env-example` file is included in the extension directory. Include the following entries:

* `IPFS_API_ENDPOINT` is provided by the IPFS Node of choice (eg. Infura or localhost). The node must resolve to a running instance of the [IPFS Kubo RPC API v0](https://docs.ipfs.tech/reference/kubo/rpc/). Providers with their own custom APIs such as Pinata and NFT.Storage will not work.
* `IPFS_API_KEY` and `IPFS_API_KEY_SECRET` are used for authentication when using the Infura IPFS service, which is currently the only service which requires authentication headers that this extension supports. If using a provider that does not require authentication headers (eg. localhost or endpoints with authentcation included in the URL) then it is optional.
* `ETH_NODE_URI` is the url of any ethereum node or gateway (eg. Alchemy).
* `PRIVATE_KEY` is the deploying account's private key.

### Configuration options
The extension has several configurable settings accessible in `Settings > Extensions > IPFS Helper`. 


| Option     | Default                                                                 | Description |
| -------- | -------------------------------------------------------------------- | ------------------------------------------------ | 
| **Environment:** Env File      |  `./.env`                                     | Location of the .env file. Path is relative to the currently opened workspace.                 
| **Artifact:** Artifact File | `./artifacts/SimpleERC721.sol/SimpleERC721.json`                                                             | Location of the precompiled ERC721 smart contract code. Path is relative to the currently opened workspace. See more information in the extension commands section                                                                       |
| **Temporary:** JSON Location     | `./upload-extension-temp`                                                            | Location of folder to place the json files generated for each NFT. Path is relative to the currently opened workspace.
| **Temporary:** Delete Temporary JSON After Deploy | `true`                                                            | Deletes the json files generated for each NFT in the temp folder after they are uploaded to IPFs and the contract has been deployed.
| **Output:** JSON File | `./src/assets/assets.json`                                                            | Target location for the output JSON File. Path is relative to the currently opened workspace.

## Use
After setting up the `.env` file, the extension commands can be run by right clicking on a folder and then choosing the command from the context menu. The available commands are detailed in the next section. Note that the commands will only appear when right clicking on folder, and not on individual files.

After a command has finished successfully, a `json` entry may be created in the `Output: JSON file` directory specified in the configuration settings. If the file does not exist, it will be created.

## Extension Commands 

#### Upload to IPFS

This command uploads a folder and all of its subfolders to IPFS. The folder can contain any file types and can include other folders. Once the command has finished, an information window will appear showing the IPFS CID hash.  

#### Upload Folder and Deploy ERC721 Contract

This command creates a ERC721 NFT collection from a folder. It uploads the folder to IPFS, generates and uploads `json` files for each image to IPFS, and deploys a smart contract. The folder can currently only contain `.png` images and can not contain any subfolders.

The smart contract is provided as a precompiled `.json` file containing the ABI and bytecode placed in the `Artifact: Artifact File` location set in the configuration settings. If the file does not exist, a default ERC721 smart contract will placed in the location and used instead.

The extension will first upload the folder to IPFS and create a json identifier for each image in the `Temporary: JSON Location` folder, then it will deploy the smart contract.

A window will appear to enter the contract constructor arguments. The following keywords are used for specific arguments.
* `$BASEURI` is the IPFS hash of the folder containing the json identifiers
* `$MAXSUPPLY` is the number of images in the folder

The extension will attempt to use regular expressions to auto-fill the keywords in the appropriate location. If using the default SimpleERC721 contract, then they will be in the correct places. **If using a custom ERC721, check that they are in the correct place and add/move them if necessary**

After the command is run successfully, an entry of the following format is created in the `Output: JSON File` location.

```json
{
  "<directory>": {
    "baseUri": "ipfs://ba...",
    "deployAddress": "0x",
    "type": "ownable"
  }
}
 ```
 
* `"<directory>"` is the local directory from the workspace root to the folder that was uploaded. It is intended to be used as an identifier when accessing the NFT information.
* `"baseURI"` is the base URI provided to the smart contract constructor. It is the IPFS URL of the parent folder of the `.json` files created for each image.  
* `deployAddress` is the address of the deployed smart contract.
* `"type": "ownable"` signifies that this is a NFT collection. Further types may be added in the future.

If the command is run on the same folder again, it will overwrite the old entry with the new one (using `directory` as the search key to find duplicates). Note that previous smart contract address will be replaced and will need to be retreived from the blockchain if needed again.
