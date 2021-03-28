import * as fs from 'fs';
import * as https from 'https';

class BundleSource{
    public url: string;

    public dictionaries: string[];

    constructor(url: string, dictionaries: string[]){
        this.url = url;
        this.dictionaries = dictionaries;
    }

    filename(): string{
        return `bundles/${this.url.substr(this.url.lastIndexOf('/') + 1)}`;
    }
}

const sources: BundleSource[] = [
    new BundleSource('https://raw.githubusercontent.com/Anuken/Mindustry/master/core/assets/bundles/bundle_ru.properties',
        ['dict-ru.txt']),
    new BundleSource('https://raw.githubusercontent.com/Anuken/Mindustry/master/core/assets/bundles/bundle.properties',
        ['dict-en.txt', 'dict-chars.txt'])
];

interface Properties{

    [key: string]: string
}

function readProperties(path: string): Properties{
    const obj: Properties = {};
    fs.readFileSync(path, 'utf8').split('\n')
        .filter(value => !!value)
        .forEach(value => {
            const spl = value.split(/\s+=\s+/g);
            obj[spl[0]] = spl[1];
        });
    return obj;
}

function escape(text: string): string{
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replace(arr: string[], obj: Properties): void{
    arr.forEach((value, index) => {
        Object.keys(obj).forEach(k => {
            const spl = value.split(' = ');
            spl[1] && (value = `${spl[0]} = ${spl[1].replace(new RegExp(escape(k), 'gui'), obj[k])}`);
        })
        arr[index] = value;
    });
}

function writeFile(path: string, data: string[]): void{
    const file = fs.createWriteStream(path);
    data.forEach(value => file.write(`${value}\n`));
    file.end();
}

sources.forEach(value => {
    let buffer = '';
    https.get(value.url, res => {
        res.on('data', data => buffer += data);
        res.on('end', () => {
            const lines: string[] = buffer.split('\n');

            value.dictionaries.map(value1 => readProperties(value1))
                .forEach(dict => replace(lines, dict));

            writeFile(value.filename(), lines);
        });
    });
});
