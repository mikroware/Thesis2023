import fg from 'fast-glob'

export function loadModules(classBase){
    return fg.sync(`**/${classBase}*.js`, {
        cwd: __dirname,
    }).reduce((obj, file) => {
        const module = require(`./${file}`).default;

        // console.log(`Loading module ${file}, with type ${module.type}`);

        obj[module.type] = module;
        return obj;
    }, {});
}
