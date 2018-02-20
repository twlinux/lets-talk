const ip = require('ip');
const colors = require('colors');
const moment = require('moment');
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

// attempt a connection to MySQL every 2 seconds
// SHOULD do this instead https://docs.docker.com/compose/startup-order/
var dbAttempt = setInterval(() => {
    // variables defined by docker-compose.yml
    let sql_config = {
        host: 'talk-db',
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        // See https://github.com/mysqljs/mysql#multiple-statement-queries
        multipleStatements: true
    };
    const mysql = require('mysql').createConnection(sql_config);
    mysql.connect(function (err) {
        if (err) {
            console.error(colors.bgRed('Cannot connect to MySQL server.'.bold.white));
            console.dir(sql_config);
            console.log(err);
        }
        else {
            clearInterval(dbAttempt);

            app.listen(process.env.PORT || 8080);
            console.log('HTTP server is online.');

            sqlOK(mysql);
        }
        // 404 handler at the very end
        app.use(function (req, res) {
            res.status(404).end();
        });
    });
}, 2000);

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
     * 
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
        // sessions are indefinite, which isn't a good thing. 
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
     * client-side input validation without server-side proofing
     * 
     * Type: SQLi
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
            output(req, `name=${req.body.name} and pass=${req.body.pass} ${outcome}`, res.statusCode);
        });
    });

    app.post('/createuser', bodyParser, function (req, res) {
        if (!req.body || !req.body.name || !req.body.pass) return res.sendStatus(400);

        // use regular expression to validate input
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
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
                    output(req, `INSERT INTO People... User_name=${req.body.name}`, colors.red(error.code));
                }
                else
                    output(req, `INSERT INTO People... User_name=${req.body.name}`,
                        colors.green(`created sessionID=${createSession(req.body.name, res)}`));
            });
    });

    // AJAX send the name that corresponds to the request's session cookie
    app.get('/my_name', function (req, res) {

        let name = loggedIn(req.cookies.session);
        if (!name) {
            res.clearCookie('session');
            return res.sendStatus(401);
        }
        res.send(name);
    });

    /*
     * ---------- HACK ----------
     * Type: CSRF
     * Where: 
     * POST /change_password
     * GET /remove_story
     * GET /create_story
     * GET /delete_account
     */
    app.post('/change_password', bodyParser, function (req, res) {
        let name = loggedIn(req.cookies.session);
        if (!name) {
            output(req, colors.red(`invalid sessionID=${req.cookies.session}`), 400);
            res.clearCookie('session');
            return res.sendStatus(401);
        }
        mysql.query('UPDATE People SET Pass=? WHERE User_name=?', [req.body.new_password, name], function (error, results) {
            if (error) {
                output(req, `UPDATE People SET Pass=${req.body.new_password} WHERE User_name=${name}`, colors.red('UNEXPECTED SQL ERROR. See output below.'));
                res.sendStatus(500);
                console.log(error);
                return;
            }
            if (results.changedRows !== 1) {
                if (results.affectedRows > 0)
                    sendModal({ title: 'Changed password', content: 'Your password was not been changed.' }, res);
                else {
                    res.status(500);
                    let message = `User_name="${name}" changed nothing.`;
                    res.send(message);
                    output(req, `UPDATE People SET Pass=${req.body.new_password} WHERE User_name="${name}"`, message);
                }
                return;
            }
            sendModal({ title: 'Changed password', content: 'Your password has been updated successfully.' }, res);
            output(req, `UPDATE People SET Pass=${req.body.new_password} WHERE User_name=${name}`, true);
        });
    });

    app.all('/logout', function (req, res) {
        let sessionID = parseInt(req.cookies.session);
        let name = allSessions.get(sessionID);
        res.clearCookie('session');
        res.redirect('/');
        if (name && allSessions.delete(sessionID))
            output(req, `${colors.green(name)} has logged out. sessionID=${colors.green(sessionID)}`, res.statusCode);
    });

    /*
     * ---------- HACK ----------
     * Where: GET /story
     * Type: SQLi
     * 
     * Server responds with complete results from query.
     * You can dump entire tables by forging requests (using curl)
     * 
     * Example:
     * curl /story?author=nobody%27%3B%20SELECT%20*%20FROM%20People%3B%20--%20comment
     * Passwords are stored in plaintext.
     * 
     * Fix: parse data server-side and dynamically create pages before serving.
     * Use "hash+salt" solution for password storage.
     */
    app.get('/story', function (req, res) {

        let authorQuery = req.query.author ? `Author='${req.query.author}' AND` : '';
        let dateQuery = `PostDate < '${req.query.after || new Date()}'`;
        // TODO AJAX PostDate > ?
        mysql.query(`SELECT * FROM Story WHERE ${authorQuery} ${dateQuery} ORDER BY PostDate DESC LIMIT ${req.query.number || 6}`,
            (error, results) => {

                if (error) {
                    output(req, `SELECT * FROM Story... COULD NOT FETCH STORIES.`, 500);
                    console.log(error);
                    res.status(500).send(error);
                    return;
                }
                let name = loggedIn(req.cookies.session);
                if (loggedIn) {
                    results = results.map(story => {
                        story['prettyDate'] = moment(story['PostDate']).format('MMM Do, YYYY [at] HH:mm:ss'); // who cares about timezone
                        if (story['Author'] === name)
                            story['own'] = true;
                        return story;
                    });
                }
                res.json(results);
            });
    });

    app.get('/remove_story', function (req, res) {

        let story_id = parseInt(req.query.story_id);
        if (Number.isNaN(story_id)) {
            output(req, colors.red(`story_id=${req.query.story_id} is not an integer`), 400);
            return res.sendStatus(400);
        }
        let name = loggedIn(req.cookies.session);
        if (!name) {
            output(req, colors.red(`invalid sessionID=${req.cookies.session}`), 400);
            res.clearCookie('session');
            return res.sendStatus(401);
        }

        mysql.query('DELETE FROM Story WHERE ID=? AND Author=?',
            [story_id, name], (error, results) => {

                if (error) {
                    output(req, colors.red('UNEXPECTED SQL ERROR'), 500);
                    console.log(error);
                    res.sendStatus(500);
                    return;
                }
                if (results.affectedRows === 1) {
                    output(req, `DELETE FROM Story WHERE ID=${story_id}...`, true);
                    sendModal({ title: 'Story removed', content: 'That story has been deleted.' }, res);
                }
                else
                    res.sendStatus(500);
            });
    });

    /*
     * ---------- HACK ----------
     * Type: XSS
     * Where: GET /create_story
     * 
     * Example: <script>setTimeout(function() {$('#3').text('Thanks Obama')}, 1000)</script> Wait for it...
     */
    app.get('/create_story', function (req, res) {

        if (!req.query.my_story) {
            output(req, colors.red('my_story is undefined'), 400);
            return res.sendStatus(400);
        }
        let name = loggedIn(req.cookies.session);
        if (!name) {
            output(req, colors.red(`invalid sessionID=${req.cookies.session}`), 400);
            res.clearCookie('session');
            return res.sendStatus(401);
        }
        mysql.query('INSERT INTO Story (Author, Content, PostDate) VALUES (?, ?, ?)',
            [name, req.query.my_story, new Date()], (error, results) => {

                if (error) {
                    output(req, colors.red('SQL ERROR'), 500);
                    console.log(error);
                    res.sendStatus(500);
                    return;
                }
                if (results.affectedRows === 1) {
                    output(req, `INSERT INTO Story... VALUES (${name}, ${req.query.my_story}...`, true);
                    res.redirect('/');
                    return;
                }
                res.sendStatus(500);
            });
    });

    app.get('/my_note', function (req, res) {

        let name = loggedIn(req.cookies.session);
        if (!name) {
            res.clearCookie('session');
            return res.sendStatus(401);
        }
        mysql.query(`SELECT Note AS note FROM People WHERE User_name='${name}'`, (error, results) => {

            if (error) {
                output(req, colors.red('SQL ERROR'), 500);
                console.log(error);
                res.sendStatus(500);
                return;
            }
            res.send(results[0].note);
        });
    });

    /*
     * ---------- HACK ----------
     * Type: SQLi
     * Where: POST /change_note
     * Example: TODO
     * UPDATE People AS a INNER JOIN People AS b ON b.User_name="Jennings Zhang" SET a.Note = b.Pass WHERE a.User_name = "Austin Long";
    */
    app.post('/change_note', bodyParser, function (req, res) {
        let name = loggedIn(req.cookies.session);
        if (!name) {
            res.clearCookie('session');
            return res.sendStatus(401);
        }
        if (!req.body.note)
            return res.sendStatus(400);

        let query = `UPDATE People SET Note='${req.body.note}' WHERE User_name='${name}'`;

        mysql.query(query,
            (error, results) => {

                if (error) {
                    output(req, colors.bold(query), 500);
                    console.log(error);
                    res.status(500).send(error);
                    return;
                }
                res.redirect('/');
            });
    });

    app.get('/delete_account', function (req, res) {

        let sessionID = parseInt(req.cookies.session);
        let name = allSessions.get(sessionID);
        res.clearCookie('session');
        allSessions.delete(sessionID);

        if (!name) {
            output(req, colors.red(`invalid sessionID=${req.cookies.session}`), 400);
            res.clearCookie('session');
            return res.sendStatus(401);
        }
        output(req);
        mysql.query('DELETE FROM Story WHERE Author=?', [name], (error, results) => {
            if (error)
                console.log(error);
            else
                console.log(`Deleted ${results.affectedRows} stories WHERE Author=${name}`);
        });
        mysql.query('DELETE FROM People WHERE User_name=?', [name], (error, results) => {
            if (error) {
                console.log(error);
                res.sendStatus(500);
                return;
            }
            if (results.affectedRows > 0) {
                sendModal({
                    title: 'Account Deleted',
                    content: 'Your account, along with all your stories, were deleted. Goodbye...'
                }, res);
            }
            else {
                res.sendStatus(500);
            }
            output(req, `DELETE FROM People WHERE User_name=${name} --> affectedRows: ${results.affectedRows}`, res.statusCode);
        });
    });

    const sendModal = (message, res) => {
        res.cookie('message', JSON.stringify(message));
        res.sendFile('cookie_check.html', { root: `${__dirname}/home/` });
    }
}

// output(req, `message`, res.statusCode);
function output(req, info, result) {

    let request;
    switch (req.method) {
        case 'GET':
            request = `${colors.green(req.method)} ${info}`;
            break;
        case 'POST':
            request = `${colors.blue(req.method)} ${colors.bold(info)}`;
            break;
        case false:
            request = 'invalid';
        default:
            request = colors.red(req.method);
    }

    if (Number.isInteger(result))
        result = colors.cyan(result);
    else if (result === true)
        result = colors.green('Successful!');

    console.log(colors.dim(`[ ${moment().format('HH:mm:ss')} ]`)
        + ` ${req.ip} ${colors.italic(req.originalUrl)}: ${request} ${result}`);
}
