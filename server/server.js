const ip = require('ip');
const colors = require('colors');
const express = require('express');
const app = express();
app.use(require('cookie-parser')());
const bodyParser = require('body-parser').urlencoded({ extended: false });

app.use('/', express.static('home'));
app.use('/assets', express.static('assets'));
app.use('/vendor', express.static('vendor'));
app.use('/vendor', express.static('node_modules/materialize-css/dist/js'));
app.use('/vendor', express.static('node_modules/material-design-icons/iconfont'));
app.use('/vendor', express.static('node_modules/jquery/dist'));
app.use('/vendor', express.static('node_modules/js-cookie/src'));

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
            app.post('/*', bodyParser, function (req, res) {
                if (!req.body) return res.sendStatus(400);
                res.send(req.body);
            });
        }
        else
            sqlOK(mysql);

        // 404 handler at the very end
        app.use(function (req, res) {
            res.status(404).end();
            output(req, colors.dim('not found'), res.statusCode);
        });
    });
})();

const port = process.env.PORT || 8080;
app.listen(port);
(function () {
    let url = `http://${port == '80' ? `${colors.bold(require('os').hostname())}.local` : `${colors.bold(ip.address())}:${colors.cyan(port.toString())}`}/`;
    console.log(`Server running at ${colors.underline(url)}`);
})();

// Call this function when connection to MySQL is successful.
function sqlOK(mysql) {
    console.log(colors.bold(`Connected to ${colors.rainbow('MySQL!')}`));

    /*
     * Session identification numbers are assigned sequentially. 
     * This is highly predictable. An attacker can modify their own cookie to
     * perform session hijacking.
     */
    var nextSession = 1;
    var allSessions = new Map();
    const createSession = (name, res) => {
        allSessions.set(nextSession, name);
        console.log('Created a session for ' + allSessions.get(nextSession) + ' id is ' + nextSession);
        res.cookie('session', nextSession);
        res.sendFile('cookie_check.html', { root: `${__dirname}/home/` });
        return nextSession++;
        // TODO clear session after timeout?
    }

    /*
     * SQLi vulnerability.
     * The query looks like this: "SELECT [...] AND (Pass=${pass})"
     * Those parenthesis makes it easy so that you can inject "  ' OR TRUE   "
     * That will match any password...
     */
    app.post('/login', bodyParser, function (req, res) {
        if (!req.body || !req.body.name || !req.body.pass)
            res.sendStatus(400);

        let query = `SELECT User_name AS name FROM People WHERE LOWER(User_name)='${req.body.name.toLowerCase()}' AND (Pass='${req.body.pass}')`;

        mysql.query(query, function (error, results, fields) {

            let outcome = '';
            if (error) {
                outcome = error.code.bold.bgRed;
                res.send(JSON.stringify(error)); // respond with error message
            }
            else {
                if (results.length === 0) {
                    res.cookie('message', JSON.stringify({ title: 'Invalid Credentials', content: 'Incorrect username and/or password.' }));
                    outcome = colors.red('Invalid credentials.');
                }
                else {
                    createSession(results[0].name, res);
                    outcome = colors.green('Logged in!');
                }
                res.sendFile('cookie_check.html', { root: `${__dirname}/home/` });
            }
            dbOutput(`name=${req.body.name} and pass=${req.body.pass}`, outcome);
        });
    });

    /*
     * Passwords are received unencrypted, they are stored unhashed.
     * The SQL query is being made with a 'prepared statement', meaning this form is immune to SQLi.
     */
    app.post('/createuser', bodyParser, function (req, res) {
        if (!req.body || !req.body.name || !req.body.pass) return res.sendStatus(400);

        // use regular expression to validate input
        if (!/^[a-zA-Z ]{1,36}$/.test(req.body.name) || !/^[^'\x22]{1,255}$/.test(req.body.pass)) return res.sendStatus(400);

        mysql.query('INSERT INTO People (User_name, Pass) VALUES (?, ?)',
            [req.body.name, req.body.pass], function (error, results, fields) {
                if (error) {
                    switch (error.code) {
                        case 'ER_DUP_ENTRY':
                            res.cookie('message', JSON.stringify({ title: 'Name taken', content: 'A user already exists with that name.' }));
                            res.sendFile('cookie_check.html', { root: `${__dirname}/home/` });
                            break;
                        case 'ER_DATA_TOO_LONG':
                            res.sendStatus(400);
                            break;
                        default:
                            res.sendStatus(503);
                    }
                    dbOutput(`name=${req.body.name}`, colors.red(error.code));
                }
                else
                    dbOutput(`name=${req.body.name} and sessionID=${createSession(req.body.name, res)}`, colors.green('user created :)'));
            });
    });

    // send the name that corresponds to the request's session cookie
    app.get('/myname', function (req, res) {

        if (!req.cookies.session)
            res.sendStatus(403);
        else {
            let name = allSessions.get(parseInt(req.cookies.session));
            if (name)
                res.send(name);
            else {
                res.clearCookie('session');
                res.sendStatus(500);
            }
        }
    });

    app.all('/logout*', function (req, res) {
        let sessionID = parseInt(req.cookies.session);
        let name = allSessions.get(sessionID);
        res.clearCookie('session');
        res.redirect('/');
        if (name && allSessions.delete(sessionID))
            console.log(`${colors.magenta(name)} has logged out. session=${colors.magenta(sessionID)}`);
    });

    const dbOutput = (param, result) => {
        console.log(`${colors.dim('SQL:')} ${colors.bold(param)} ${result}`);
    }
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
