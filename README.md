# lets-talk

![badge](https://img.shields.io/badge/security-trash-red.svg)
[![GitHub license](https://img.shields.io/github/license/twlinux/lets-talk.svg)](https://github.com/twlinux/lets-talk/blob/master/LICENSE)
[![ESLint](https://img.shields.io/badge/style-ESLint-463fd4.svg?logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmlld0JveD0iMCAwIDI5NC44MjUgMjU4Ljk4MiIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI%2BPGc%2BPHBhdGggZmlsbD0iIzgwODBGMiIgZD0iTTk3LjAyMSw5OS4wMTZsNDguNDMyLTI3Ljk2MmMxLjIxMi0wLjcsMi43MDYtMC43LDMuOTE4LDBsNDguNDMzLDI3Ljk2MmMxLjIxMSwwLjcsMS45NTksMS45OTMsMS45NTksMy4zOTN2NTUuOTI0YzAsMS4zOTktMC43NDgsMi42OTMtMS45NTksMy4zOTRsLTQ4LjQzMywyNy45NjJjLTEuMjEyLDAuNy0yLjcwNiwwLjctMy45MTgsMGwtNDguNDMyLTI3Ljk2MmMtMS4yMTItMC43LTEuOTU5LTEuOTk0LTEuOTU5LTMuMzk0di01NS45MjRDOTUuMDYzLDEwMS4wMDksOTUuODEsOTkuNzE2LDk3LjAyMSw5OS4wMTYiLz48cGF0aCBmaWxsPSIjNEIzMkMzIiBkPSJNMjczLjMzNiwxMjQuNDg4TDIxNS40NjksMjMuODE2Yy0yLjEwMi0zLjY0LTUuOTg1LTYuMzI1LTEwLjE4OC02LjMyNUg4OS41NDVjLTQuMjA0LDAtOC4wODgsMi42ODUtMTAuMTksNi4zMjVsLTU3Ljg2NywxMDAuNDVjLTIuMTAyLDMuNjQxLTIuMTAyLDguMjM2LDAsMTEuODc3bDU3Ljg2Nyw5OS44NDdjMi4xMDIsMy42NCw1Ljk4Niw1LjUwMSwxMC4xOSw1LjUwMWgxMTUuNzM1YzQuMjAzLDAsOC4wODctMS44MDUsMTAuMTg4LTUuNDQ2bDU3Ljg2Ny0xMDAuMDFDMjc1LjQzOSwxMzIuMzk2LDI3NS40MzksMTI4LjEyOCwyNzMuMzM2LDEyNC40ODggTTIyNS40MTksMTcyLjg5OGMwLDEuNDgtMC44OTEsMi44NDktMi4xNzQsMy41OWwtNzMuNzEsNDIuNTI3Yy0xLjI4MiwwLjc0LTIuODg4LDAuNzQtNC4xNywwbC03My43NjctNDIuNTI3Yy0xLjI4Mi0wLjc0MS0yLjE3OS0yLjEwOS0yLjE3OS0zLjU5Vjg3Ljg0M2MwLTEuNDgxLDAuODg0LTIuODQ5LDIuMTY3LTMuNTlsNzMuNzA3LTQyLjUyN2MxLjI4Mi0wLjc0MSwyLjg4Ni0wLjc0MSw0LjE2OCwwbDczLjc3Miw0Mi41MjdjMS4yODMsMC43NDEsMi4xODYsMi4xMDksMi4xODYsMy41OVYxNzIuODk4eiIvPjwvZz48L3N2Zz4%3D)](https://github.com/twlinux/lets-talk/blob/master/server/.eslintrc.js)

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
