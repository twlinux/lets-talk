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
    //require('node-env-file')(`${__dirname}/../database/variables.env`);
    let sql_config = {
        host: 'talk-db',
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
    console.log('HTTP server is online.');
    // console.log(`Server running at ${colors.underline(url)}`);
    // console.log(`Local: ${colors.underline(`http://localhost:${port}`)}`);
})();

// Call this function when connection to MySQL is successful.
function sqlOK(mysql) {
    console.log(colors.bold(`Connected to ${colors.rainbow('MySQL!')}`));

    /*
     * ---------- HACK ----------
     * Session management
     * 
     * Session identification numbers are assigned sequentially. 
     * This is highly predictable. An attacker can modify their own cookie to
     * perform session hijacking.
     * Fix: 
     * more sophisticated session management solution: https://github.com/expressjs/session
     * use signed cookies. https://github.com/expressjs/cookie-parser#cookieparsersecret-options
     * Associate cookie with client's IP address.
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

    const loggedIn = (sessionID) => {
        if (!sessionID)
            return null;
        return allSessions.get(parseInt(sessionID));
    }

    /*
     * ---------- HACK ----------
     * Where: login form
     * 
     * Type: SQLi
     * Vulnerability: client-side input validation without server-side proofing
     * Example: provide a valid username. For the password, try:
     * ' OR TRUE OR '
     * ` OR TRUE); -- comment
     * Fix: use SQL prepared statements.
     * 
     * Type: MitM
     * Vulnerability: unencrypted transmission of credentials
     * Exploit: https://github.com/twlinux/club/wiki/Man-in-the-Middle-(MitM)-Attack-%E2%80%93-ARP-Poisoning
     * Fix: use HTTPS, hash + salt passwords on client before POST
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
     * ---------- HACK ----------
     * Passwords are stored in plaintext.
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
                            sendModal({ title: 'Name taken', content: 'A user already exists with that name.' }, res);
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

    // AJAX send the name that corresponds to the request's session cookie
    app.get('/myname', function (req, res) {

        let name = loggedIn(req.cookies.session);
        if (!name) {
            res.clearCookie('session');
            return res.sendStatus(400);
        }
        res.send(name);
    });

    /*
     * ---------- HACK ----------
     * Where: POST /change_password
     * 
     * Type: CSRF
     */
    app.post('/change_password', bodyParser, function (req, res) {
        let name = loggedIn(req.cookies.session);
        if (!name) {
            output(req, colors.red(`invalid sessionID=${req.cookies.session}`), 400);
            res.clearCookie('session');
            return res.sendStatus(400);
        }
        mysql.query('UPDATE People SET Pass=? WHERE User_name=?', [req.body.new_password, name], function (error, results) {
            if (error) {
                dbOutput(`User_name=${name}`, colors.red('SQL error when trying to UPDATE Pass.'))
                res.sendStatus(500);
                console.log(error);
                return;
            }
            if (results.changedRows !== 1) {
                res.status(500);
                let message = `User_name ${name} not found.`;
                res.send(message);
                dbOutput('change_password', colors.red(message));
                return;
            }
            sendModal({ title: 'Changed password', content: 'Your password has been updated successfully.' }, res);
            dbOutput(`User_name=${name}`, colors.green(`UPDATE Pass=${req.body.new_password}`));
        });
    });

    app.all('/logout*', function (req, res) {
        let sessionID = parseInt(req.cookies.session);
        let name = allSessions.get(sessionID);
        res.clearCookie('session');
        res.redirect('/');
        if (name && allSessions.delete(sessionID))
            console.log(`${colors.magenta(name)} has logged out. session=${colors.magenta(sessionID)}`);
    });

    app.get('/story', function (req, res) {

        mysql.query('SELECT * FROM Story WHERE PostDate < ? ORDER BY PostDate DESC LIMIT ?',
            [req.query.after || new Date(), req.query.number || 5],
            (error, results) => {

                if (error) {
                    console.log(error);
                    return res.sendStatus(500);
                }

                let name = loggedIn(req.cookies.session);
                if (loggedIn) {
                    results = results.map(story => {
                        if (story['Author'] === name)
                            story['own'] = true;
                        return story;
                    });
                }
                res.json(results);
            });
    });

    const sendModal = (message, res) => {
        res.cookie('message', JSON.stringify(message));
        res.sendFile('cookie_check.html', { root: `${__dirname}/home/` });
    }

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
    console.log(`${'SIGINT'.underline.red} received, process exiting.`);
    process.exit();
});
process.on('SIGTERM', function () {
    console.log(`${'SIGTERM'.underline.red} received, process exiting.`);
    process.exit();
});
