const fs = require('fs-extra');

const compilerPath = '/STM32WL' // Path to the STM32WL compiler files
const generalSetupPath = process.env.General_Setup_path;
const configApplicationPath = process.env.config_application_path;

/**
 * Modify the .h file with the json using regex
 */
async function modifyHFile(source,jsonConfig){
    try {
        // Read async
        let data = await fs.readFile(source, 'utf8');
        let modifiedData = data;

        for (let [key, value] of Object.entries(jsonConfig)) {
            // Special case : { 0x00, ... }
            if(key == "devEUI_" || key == "appEUI_"){
                let regex = new RegExp(`(#define ${key}\\s+{ ).+[0-9]`,'m');
                modifiedData = modifiedData.replace(regex,`$1${value}`);
            // Special case : ( uint32_t )0x00...
            } else if(key == "devAddr_"){
                let regex = new RegExp(`(#define ${key}\\s+.*)0x[0-9]+`,'m')
                modifiedData = modifiedData.replace(regex,`$1${value}`);
            // Default case
            } else {
                let regex = new RegExp(`(#define ${key}\\s+)[a-zA-Z0-9_,]+`,'m');
                modifiedData = modifiedData.replace(regex,`$1${value}`);
            }
        }
        // Write changes to file
        await writeFileAsync(source, modifiedData);
    } catch (err) {
        console.error(`Error reading or writing in file : ${err}`);
    }
}

/**
 * Create the folders in the shared volume for compiler files and results .bin
 */
async function initSharedVolume(volName) {
    console.log(`Initiating shared volume ${volName}`)
    try {
        await fs.mkdir(`/${volName}/configs`, { recursive: true });
        console.log(`Init : configs folder created or already there`);
        await fs.mkdir(`/${volName}/results`, { recursive: true });
        console.log(`Init : results folder created or already there`);
    } catch (err) {
        console.error(`Error initiating shared volume '${volName}':`, err);
    }
}

/**
 * Setup the files for the compilation process
 */
async function setupFiles(configPath,resultPath,jsonConfigApplication,jsonGeneralSetup){
    // Creating folders
    await createDir(configPath)
    await createDir(resultPath)

    // Copy compiler files
    await copyDir(compilerPath,configPath);
    
    // Modify .h files with json
    await modifyHFile(`${configPath}${configApplicationPath}/config_application.h`,jsonConfigApplication);
    await modifyHFile(`${configPath}${generalSetupPath}/General_Setup.h`,jsonGeneralSetup);
}

async function copyDir(source, destination) {
    console.log(`Copying STM32WL to ${destination}`)
    try {
        await fs.copy(source, destination);
    } catch (err) {
        console.error('Error copying files : ', err);
    }
}

async function createDir(dir) {
    try {
        await fs.access(dir);
        console.log(`Folder already exist : ${dir}`);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(dir, { recursive: true });
        } else {
            console.error(`Error verrifying file : ${err}`);
        }
    }
}

async function deleteDir(path) {
    try {
      await fs.remove(path);
      console.log(`${path} directory removed`);
    } catch (err) {
      console.error(`Error suppressing ${path} directory :`, err);
    }
  }

async function writeFileAsync(source, modifiedData) {    
    try {
        await fs.writeFile(source, modifiedData);
        console.log(`${source} modified`)
    } catch (err) {
        console.error(`Error writing in file : ${err}`);
    }
}

module.exports = {
    initSharedVolume,
    setupFiles,
    deleteDir
};