#!/usr/bin/node
const __cwd = process.cwd();
const isBuild = false;
const argv = process.argv.slice(!isBuild ? 2 : 1);
const fs = require('fs');
const { exec } = require('child_process');
const include_path = '/usr/include/c++/' + fs.readdirSync('/usr/include/c++/')[0] + '/';

if (argv.length !== 1) {
    console.log('Usage: node index.js <file>');
    process.exit(1);
}
// if(process.platform != 'linux'){
//     console.log(`This script is only supported on Linux`);
//     process.exit(1);
// }

const file = argv[0];
if (!fs.readdirSync(__cwd).includes(file)){
    console.log(`File ${file} not found`);
    process.exit(1);
}

/**
 * Parse c++ #include statements
 * @param {string} value 
 * @returns an array of included files
 */
function parse(value) {
    let returns = [];
    const valueArr = value.split('\n');
    const includes = valueArr.filter(line => line.trim().startsWith('#include'));
    for (const statement of includes) {
        const stmt = statement.trim().split(' ');
        if (stmt.length !== 2) {
            console.log(`Invalid include statement: ${statement}`);
            process.exit(1);
        }
        if (stmt[1].startsWith('<')) {
            const header = stmt[1].slice(1, -1);
            returns.push(include_path + header);
        }else if(stmt[1].startsWith('"')){
            returns.push(__cwd +'/'+ stmt[1].slice(1, -1));
        }
    }
    return returns;
}
function deleteIncludeStatament(fileBody) {
    return fileBody.split('\n').filter(line => !line.trim().startsWith('#include')).join('\n');
}
function getClearFile(file) {
    return deleteIncludeStatament(fs.readFileSync(file, 'utf8'));
}
function compile(file){
    const fileBody = fs.readFileSync(file, 'utf8');
    let outputFile = [getClearFile(file)];
    let includes = [];
    let notChecked = [];
    for (const file of parse(fileBody)) {
        notChecked.push(file);
    }
    console.log([notChecked]);
    
    while(notChecked.length > 0){
        let newNotChecked = [];
        for (let i = notChecked.length - 1; i > -1; i--) {
            const file = notChecked[i];
            for (const newFile of parse(fs.readFileSync(file, 'utf8'))) {
                includes.push(file);
                notChecked.pop();
                newNotChecked.push(newFile);
            }
        }
        notChecked = newNotChecked;
    }

    for (const file of includes) {
        outputFile.push(getClearFile(file));
    }

    return outputFile.reverse().join('\n');
}

let outputFile = compile(file);
console.log(outputFile);

fs.mkdirSync(__cwd + '/coolmake_out');
fs.writeFileSync(__cwd + '/coolmake_out/out.cpp', outputFile);
console.log(`
Complile complete 
Now compile coolmake_out/out.cpp
Using your favorite compiler     
`);
