const fs = require('fs')
const path = require('path');
const compileFromFile = require('json-schema-to-typescript').compileFromFile;

const drive = path.resolve(__dirname).substring(0, 2).toLowerCase();

const localResolver = {
    order: 1,
    canRead(file){
        // Only read non extension files which do start with a slash "/" (remove "c:" which is put in-front on Windows)
        return Boolean(file.extension === '' && file.url.replace(drive, '').indexOf('/') === 0);
    },
    read(file){
        const filePath = path.resolve(__dirname, '../src/config/commonSchemas', `${file.url.replace(drive, '').substring(1)}.json`);
        return fs.readFileSync(filePath);
    },
};

compileFromFile('./configSchema.json', {
    unknownAny: false,
    $refOptions: {
        resolve: {
            local: localResolver,
        },
    },
}).then(ts => {
    fs.writeFileSync('./configSchema.ts', ts);
    console.log('Created Typescript config definitions from the json schema.');
});
