import fs from 'fs';
import { groupBy } from 'ramda';

function convertFile(file, runsToIncludeOverride){
    const data = JSON.parse(fs.readFileSync(`./metrics/${file}`, { encoding: 'utf8' }));
    const field = file.replace('graph-', '').replace('.json', '');

    const grouped = groupBy((row => row.metrics[field]))(data);

    const results = Object.values(grouped).map(rows => {
        // TODO: reduce rows on all metrics to avg? Which rows to pick? This depends........
        // const runsToInclude = [1];
        // const runsToInclude = [3];
        const runsToInclude = runsToIncludeOverride || [4,5];

        const filteredRows = rows.filter(row => runsToInclude.includes(row.run));

        function getAvg(field){
            return filteredRows.reduce((tot, row) => tot + row.metrics[field], 0) / filteredRows.length;
        }

        function getAvgClient(file){
            return filteredRows.reduce((tot, row) => tot + row.metrics['clientRuntime']?.[file]?.[0], 0) / filteredRows.length;
        }

        function getAvgVisuals(){
            return filteredRows.reduce((tot, row) => tot + row.metrics['clientRuntimeVisuals']?.[0], 0) / filteredRows.length;
        }

        return {
            vertices: getAvg('vertices'),
            objects: getAvg('objects'),
            clients: getAvg('clients'),
            serverRuntime: getAvg('serverRuntime'),
            clientRuntime: (getAvgClient('data2.json') || 0) + (getAvgClient('data5.json') || 0),
            clientRuntimeVisuals: getAvgVisuals(),
        };
    });

    const resultFile = `./metrics/results-${field}.csv`;

    const headers = Object.keys(results[0]).join(';')
    const rows = results.map(row => Object.values(row).join(';')).join('\r\n');

    if(fs.existsSync(resultFile)){
        fs.appendFileSync(resultFile, `\r\n${rows}`);
    }else{
        fs.writeFileSync(resultFile, `${headers}\r\n${rows}`);
    }
}

fs.readdir('./metrics', (err, files) => {
    files.forEach(file => {
        if (file.indexOf('graph-') === 0){
            convertFile(file);
            // convertFile(file, [1]);
            // convertFile(file, [3]);
            // convertFile(file, [4,5]);
        }
    });
});
