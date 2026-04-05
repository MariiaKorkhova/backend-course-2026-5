const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { program } = require('commander');

program
    .requiredOption('-h, --host <type>')
    .requiredOption('-p, --port <number>')
    .requiredOption('-c, --cache <path>')
    .configureOutput({
        outputError: (str, write) =>
        {
            if (str.includes("required option"))
                {
                return write("error: specify required options (-h, -p, -c)\n");
            }

            return write(str);
        }
    })

    .parse(process.argv);

const options = program.opts();

if (!fs.existsSync(options.cache))
{
    fs.mkdirSync(options.cache, { recursive: true });
    console.log(`cache directory created: ${options.cache}`);
}

const server = http.createServer((req, res) =>
{
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('proxy server ready to work');
});

server.listen(options.port, options.host, () =>
{
    console.log(`server started at: http://${options.host}:${options.port}`);
    console.log(`caching into directory: ${path.resolve(options.cache)}`);
});