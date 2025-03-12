const { rejects } = require('assert');
const fs = require('fs');

// node ../../utils/shared-libs.js ./solvePnP

// Get executable argument
let executable = null;
let outputDir = null;
process.argv.forEach(function (val, index, array) {
    switch (index) {
        case 2:
            executable = val;
            break;
        case 3:
            outputDir = val;
            break;
        default:
            break;
    }
});
if (executable == null) {
    console.error('define the executable')
    return;
}
if (outputDir == null) {
    console.error('define the outputDir')
    return;
}

async function runExecutable(path, argumentos) {
    const spawnSync = require('child_process').spawnSync;
    const child = spawnSync(path, argumentos, { encoding: 'utf8' });
    return child.stdout;
}

function copyFile(origin, destinationFolder) {
    const fileName = /([^\/]+)$/.exec(origin)[1];
    return new Promise((resolve, reject) => {
        fs.copyFile(origin, destinationFolder + "/" + fileName, (err) => {
            if (err) {
                reject(err)
            } else {
                resolve();
            }
        });
    });
}

async function analize() {
    const response = await runExecutable("ldd", [executable]);
    const lineas = response.split('\n');
    const pathFiles = [];
    // Get file paths
    for (let i = 0; i < lineas.length; i++) {
        const linea = lineas[i];
        const partes = /=>([^$]+)$/igm.exec(linea);
        if (partes != null) {
            let path = partes[1];
            path = path.replace(/\s+\(.*/ig, '');
            pathFiles.push(path.trim());
        }
    }
    const DEST_ROOT = outputDir;
    if (!fs.existsSync(DEST_ROOT)) {
        fs.mkdirSync(DEST_ROOT);
    }
    const DEST_DIR = `${DEST_ROOT}/libs`;
    if (!fs.existsSync(DEST_DIR)) {
        fs.mkdirSync(DEST_DIR);
    }
    // Copy files into folder
    for (let i = 0; i < pathFiles.length; i++) {
        await copyFile(pathFiles[i], DEST_DIR);
    }
    await copyFile(executable, DEST_ROOT);
    // Zip folder
    // const zipRes = await runExecutable("zip", ["-r", "shared-libs.zip", DEST_DIR]);
}

analize();



