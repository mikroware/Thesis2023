import fs from 'fs'
import prettyBytes from 'pretty-bytes'
import SourceInputModule from '../SourceInputModule'

export default class SourceInputSocket extends SourceInputModule {
    static type = 'socket';
    static name = 'Socket';

    static schema = require('./SourceInputSocket.json');

    run(item, context) {
        if(!this.props.live){
            this.dispatch({
                path: this.props.path,
            }, 'socket-close');

            return null;
        }

        // Got data for this socket
        if(context.invokeDetails?.socketData?.[this.props.path]){
            const copyPath = `${item.filePath}`;
            const time = new Date();

            const data = JSON.parse(context.invokeDetails.socketData[this.props.path]);

            // TODO: this should be moved to another processing step, but no time of course
            const parsedData = data.map(item => ({
                type: 'Feature',
                properties: item.meta,
                geometry: {
                    type: 'Point',
                    coordinates: item.cords,
                },
            }));
            fs.writeFileSync(`${copyPath}.geojson`, JSON.stringify(parsedData));

            fs.writeFileSync(copyPath, JSON.stringify(data));
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
        }

        // Otherwise just send the create event
        this.dispatch({
            path: this.props.path,
        }, 'socket');

        return null;
    }

    getChanged() {
        return this.isChanged;
    }
}
