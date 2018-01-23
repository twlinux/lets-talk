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

### MySQL Container

Install `docker-compose` (on Ubuntu)

```bash
sudo apt install docker-compose
```

Start the container.

```bash
cd database && docker-compose up [-d]
```

### Express Server

Install dependencies (on Ubuntu)

```bash
sudo apt install npm
cd server
npm install
```

Start the server

```bash
npm test #port 8080
npm start #port 80
```
