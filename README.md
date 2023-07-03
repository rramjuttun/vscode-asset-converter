# IPFS and NFT Extension for VS Code

This is a VS Code extension for uploading project resources to IPFS and creating NFT Collections from them. Its main purpose is to help onboard game developers to the Web3 stack by providing a way to transition assets from traditional centralized storage to a decentralized environment. 

The project management page for this extension is [here](https://github.com/users/rramjuttun/projects/1).
\
The design document for the extension is here [here](https://github.com/rramjuttun/vscode-asset-converter/blob/main/docs/designdoc.md).
## Features
* Upload common resource folders to IPFS 

* Create NFT collections from ownable asset folders

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

## Setup and Use

Once installed, press `F5` to start the extension development host or go to `Run > Start Debugging` in the menu bar. This will open up a new VS Code instance with the extension running in it. Open any folder within this instance to use as the workspace.

Create a `.env` file in the workspace or add the following to your existing file if one already exists. A `.env-example` file is included in the extension directory. Include the following entries:

* `IPFS_API_ENDPOINT` is provided by the IPFS Node of choice (eg. Infura or localhost). The node must resolve to a running instance of the [IPFS Kubo RPC API v0](https://docs.ipfs.tech/reference/kubo/rpc/). Providers with their own custom APIs such as Pinata and NFT.Storage will not work.
* `IPFS_API_KEY` and `IPFS_API_KEY_SECRET` are used if authentication is required (eg. Infura). If using a provider that does not require authentication (eg. localhost) then it is optional.
* `ETH_NODE_URI` is the url of any ethereum node or gateway (eg. Alchemy).
* `PRIVATE_KEY` is the deploying account's private key.

After setting up the `.env` file, the extension commands can be run by right clicking on a folder and then choosing the command from the context menu. Note that the commands will only appear when right clicking on folder, and not on files. The available commands are detailed in the next section. After a command has finished successfully, a `json` entry will be created in the `test.json` file in your directory. If the file does not exist, it will be created.

## Extension Commands 

#### Upload to IPFS

This command uploads a folder and all of its subfolders to IPFS. The folder can contain any file types and can include other folders. This is used for uploading common resources that do not require ownership or association with an account such as background and menu images.  

When the command is run successfully, an entry of the following format is created in `test.json` 

```json
{
    "directory": "...",
    "type": "common",
    "hash": "bafybei...",
    "uri": "/ipfs/bafybei..."
 }

```
* `"directory"` is the local directory from the workspace root to the folder that was uploaded
* `"type": "common"` signifies that it was a common folder and a NFT collection was not created for it.
* `"hash"` and is the content identifier for the uploaded folder. It can be used when fetching from IPFS via CLI.
* `"uri"` is the hash prefixed with `/ipfs/`. It can be used when fetching from IPFS via gateways.

If the command is run on the same folder again, it will overwrite the old entry with the new one (using `"directory"` as the search key to find duplicates). 

#### Upload Folder and Deploy ERC721 Contract

This command creates a ERC721 NFT collection from a folder. It uploads the folder to IPFS, generates and uploads `json` files for each image to IPFS, and deploys a smart contract. The folder can only contain `.png` images and can not contain any subfolders.

The smart contract is provided as a precompiled `.json` file containing the ABI and bytecode. The extension will place the smart contract file in the `artifacts` folder in the workspace. If the folder does not exist, it will create it. (Note that currently this functionality is hard coded to use the `artifacts/SimpleERC721.json` smart contract).

After the command is run successfully, an entry of the following format is created in `test.json`  

```json
{
    "directory": "...",
    "type": "ownable",
    "baseUri": "ipfs://bafybei.../",
    "deployAddress": "0x..."
 }
 ```
 
* `"directory"` is the local directory from the workspace root to the folder that was uploaded
* `"type": "ownable"` signifies that it was a ownable asset folder and a NFT collection was created for it.
* `"baseURI"` is the base URI provided to the smart contract constructor. It is the IPFS URL of the parent folder of the `.json` files created for each image.  
* `deployAddress` is the address of the deployed smart contract.

If the command is run on the same folder again, it will overwrite the old entry with the new one (using `directory` as the search key to find duplicates). Note that previous smart contract address will be replaced and will need to be retreived from the blockchain if needed again.
 
 












