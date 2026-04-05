const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const { program } = require('commander');

const fsPromises = require('node:fs/promises');
const superagent = require('superagent');

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

const server = http.createServer(async (req, res) =>
{
    const httpCode = req.url.slice(1); 
    const filePath = path.join(options.cache, `${httpCode}.jpg`);

    try {
        switch (req.method)
        {
            case 'GET':
                try
                {
                    const image = await fsPromises.readFile(filePath);

                    res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                    res.end(image);
                } catch (err)
                {
                    try
                    {
                        const catResponse = await superagent.get(`https://http.cat/${httpCode}`);
                        const imageBuffer = catResponse.body;
                        
                        await fsPromises.writeFile(filePath, imageBuffer);
                        
                        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                        res.end(imageBuffer);
                    } catch (fetchErr)
                    {
                        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                        res.end('not found\n');
                    }
                }

                break;

            case 'PUT':
                try
                {
                    const chunks = [];

                    for await (const chunk of req)
                    {
                        chunks.push(chunk);
                    }

                    const buffer = Buffer.concat(chunks);
                
                    await fsPromises.writeFile(filePath, buffer);
                    
                    res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('сreated\n');
                } catch (err)
                {
                    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('internal server error\n');
                }

                break;
            
            case 'DELETE':
                try
                {
                    await fsPromises.unlink(filePath);
                    
                    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('deleted\n');
                } catch (err)
                {
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('not found\n');
                }

                break;

            default:
                res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('method not allowed\n');
                break;
        }
    } catch (error)
    {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('internal server error');
    }
});

server.listen(options.port, options.host, () =>
{
    console.log(`server started at: http://${options.host}:${options.port}`);
    console.log(`caching into directory: ${path.resolve(options.cache)}`);
});