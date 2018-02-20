# lets-talk

![badge](https://img.shields.io/badge/security-trash-red.svg)
[![GitHub license](https://img.shields.io/github/license/twlinux/lets-talk.svg)](https://github.com/twlinux/lets-talk/blob/master/LICENSE)

*Let's Talk!* is a small web app that demonstrates SQL injection and cross-site scripting vulnerabilities.

## Web Stack

| Layer      | Solution                                                                        |
|------------|---------------------------------------------------------------------------------|
| server     | [node.js + express](https://expressjs.com/)                                     |
| database   | [Docker + MySQL](https://hub.docker.com/r/mysql/mysql-server/)                  |
| front-end  | [materialize-css](http://materializecss.com/) and [jQuery](https://jquery.com/) |

## Deployment

```bash
sudo apt install docker-compose
chmod +x url_start.sh           # executable permission
./url_start.sh                  # connect to host port 8080
sudo PORT=80 ./url_start.sh     # connect to host port 80
```

## Vulnerabilities

*(that I know of)*

- [Cross-site Scripting (XSS)](https://www.owasp.org/index.php/Cross-site_Scripting_(XSS))
- [SQL Injection (SQLi)](https://www.owasp.org/index.php/SQL_Injection)
- [Cross-Site Request Forgery (CSRF)](https://www.owasp.org/index.php/Cross-Site_Request_Forgery_(CSRF))

Reports are found as multi-line comments in server.js.

```bash
awk '/- HACK/,/\*\//{printf("%-4s%s\n", NR":", $0)}' server/server.js | less -p '^.*HACK.*$'
```

Examples at https://twlinux.github.io/
