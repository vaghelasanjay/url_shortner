import { appendFile, readFile, writeFile } from 'fs/promises';
import {createServer} from 'http';
import crypto from 'crypto';
import path from 'path';
import { json } from 'stream/consumers';

const DATA_FILE = path.join("data","links.json")

const serveFile = async (res,filePath,contentType) => {
    try {
        const data = await readFile(path.join(filePath));
        res.writeHead(200,{'content-type':contentType});
        res.end(data)
    } catch (error) {
        res.writeHead(404,{'content-type':'text/html'});
        res.end("404 Page not found")
    }
}

const loadLinks = async () => {
    try {
        const data =  await readFile(DATA_FILE,'utf-8')
        return JSON.parse(data);
    } catch (error) {
        if(error.code === "ENOENT"){
            await writeFile(DATA_FILE,JSON.stringify({}))
            return {}
        }
        throw error;
    }
}

const saveLinks = async (links) => {
    try {
        await writeFile(DATA_FILE,JSON.stringify(links),'utf-8')
    } catch (error) {
        
    }
}

const server = createServer(async (req,res) => {
    if(req.method === 'GET'){
        if(req.url === '/'){
            return serveFile(res,path.join("public","index.html"),'text/html');
        } if(req.url === '/style.css'){
               return serveFile(res,path.join("public","style.css"),'text/css');  
        } else if(req.url === '/getLinks'){ 
            const links = await loadLinks();
            res.writeHead(200,{'content-type':'application/json'});
            return res.end(JSON.stringify({success:true,datas:links}))
        } else {
            const links = await loadLinks();
            const code = req.url.slice(1);
            if(links[code]){
                res.writeHead(302,{'location':links[code]});
                return res.end()
            }

            res.writeHead(400,{'content-type':'text/plain'});
            return res.end("No data found")
        }
    }  

    if(req.method === 'POST' && req.url === '/shorten'){

        const links = await loadLinks();

        let body = "";
        req.on("data", (chunk) => {
            body+=chunk;
        })
        req.on('end', async () => {
            console.log(body);
            const {url,shortCode} = JSON.parse(body);
            if(!url){
                res.writeHead(400,{'content-type':'text/plain'});
                return res.end("URL is Required")
            }
            
            const finalShortCode = shortCode || crypto.randomBytes(4).toString("hex");
            
            if(links[finalShortCode]){
                res.writeHead(400,{'content-type':'text/plain'});
                return res.end("ShortCode already exists")
            }

            links[finalShortCode] = url;
            await saveLinks(links);
            res.writeHead(200,{'content-type':'application/json'});
            return res.end(JSON.stringify({success:true,shortCode:finalShortCode}))
        })
    }
})



server.listen(3000,()=>{
    console.log("Server Runinng at http://localhost:3000")
})