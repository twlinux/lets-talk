FROM node:carbon

# timezon3
# dpkg-reconfigure tzdata
# https://serverfault.com/a/683651

ENV TZ=America/New_York

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

EXPOSE 8080

COPY wait-for-it.sh .
RUN [ "chmod", "+x", "wait-for-it.sh" ]

CMD [ "npm", "start" ]
