import http from 'http';
console.log("Error catcher listening on 8080");
http.createServer((req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        console.log("BROWSER ERROR:", body);
        res.end('ok');
    });
}).listen(8080);
