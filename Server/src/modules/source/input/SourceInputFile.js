import fs from 'fs'
import path from 'path'
import prettyBytes from 'pretty-bytes'
import SourceInputModule from '../SourceInputModule'

export default class SourceInputFile extends SourceInputModule {
    static type = 'file';
    static name = 'File';

    static schema = require('./SourceInputFile.json');

    run(item, context) {
        const copyPath = `${item.filePath}`;// do not include ext as further pipelines will not know ${path.extname(this.props.path) || '.raw'}`;

        const doCopy = context.forceRerun
            || !fs.existsSync(copyPath)
            || fs.statSync(copyPath).mtimeMs < fs.statSync(this.props.path).mtimeMs;

        if(doCopy){
            const time = new Date();

            fs.copyFileSync(this.props.path, copyPath);
            fs.utimesSync(copyPath, time, time);
            const stats = fs.statSync(copyPath);

            this.isChanged = true;

            return {
                lastCached: time.toISOString(),
                fileStats: {
                    modifiedTime: stats.mtime,
                    sizeBytes: stats.size,
                    sizeReadable: prettyBytes(stats.size),
                },
            }
        }else{
            console.log(`Skipping copying for ${copyPath}`);
        }
    }

    getChanged() {
        return this.isChanged;
    }
}
