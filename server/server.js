const ip = require('ip');
const colors = require('colors');
const express = require('express');
const app = express();
app.use(require('cookie-parser')());
const bodyParser = require('body-parser').urlencoded({ extended: false });

app.post('/login', bodyParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    res.send(req.body);
});

app.post('/newuser', bodyParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);
    res.send(req.body);
});


app.use('/', express.static('home'));
app.use('/assets', express.static('assets'));
app.use('/vendor', express.static('vendor'));
app.use('/vendor', express.static('node_modules/materialize-css/dist/js'));
app.use('/vendor', express.static('node_modules/material-design-icons/iconfont'));
app.use('/vendor', express.static('node_modules/jquery/dist'));

app.use(function (req, res) {
    res.status(404).end();
    output(req, colors.dim('not found'), res.statusCode);
});

// connect to MySQL server
(function () {
    require('node-env-file')(`${__dirname}/../database/variables.env`);
    let sql_config = {
        host: 'localhost',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
    };
    const mysql = require('mysql').createConnection(sql_config);
    mysql.connect(function (err) {
        if (err) {
            console.error(colors.bgRed('Cannot connect to MySQL server.'.bold.white));
            console.dir(sql_config);
            console.log(err);
        }
        else
            sqlOK(mysql);
    });
})();

const port = process.env.PORT || 8080;
app.listen(port);
let url = `http://${port == '80' ? `${colors.bold(require('os').hostname())}.local` : `${colors.bold(ip.address())}:${colors.cyan(port.toString())}`}/`;
console.log(`Server running at ${colors.underline(url)}`);

/*
 * Call this function when connection to MySQL is successful.
 */
function sqlOK(mysql) {
    console.log(colors.bold(`Connected to ${colors.rainbow('MySQL!')}`));

    let test = 'SELECT 1 + 1 AS solution;';
    mysql.query(test, function (err, rows, fields) {
        if (err) throw err;
        console.log(colors.dim(`${test} rows[0].solution --> ${rows[0].solution} ${rows[0].solution == 2 ? 'PASS' : 'FAIL'}`));
    });
}


// output(req, `message`, res.statusCode);
function output(req, info, statusCode) {

    let request;
    switch (req.method) {
        case 'GET':
            request = `${colors.green(req.method)} ${info}`;
            break;
        case 'POST':
            request = `${colors.blue(req.method)} ${colors.bold(info.magenta)}`;
            break;
        case false:
            request = 'invalid';
        default:
            request = colors.red(req.method);
    }
    let date = new Date();
    console.log(colors.dim(`[  ${date.getHours()}:${date.getMinutes()} ${date.getSeconds()} ]`)
        + ` ${req.ip} ${colors.italic(req.originalUrl)}: ${request} ${colors.magenta(statusCode)}`);
}

// npm cleans up connection to MySQL
process.on('SIGINT', function () {
    console.log(`${'SIGINT'.underline.red} recieved, process exiting.`);
    process.exit();
});
process.on('SIGTERM', function () {
    console.log(`${'SIGTERM'.underline.red} recieved, process exiting.`);
    process.exit();
});
