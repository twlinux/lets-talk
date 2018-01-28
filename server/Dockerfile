FROM node:carbon

# timezon3
# dpkg-reconfigure tzdata
# https://serverfault.com/a/683651

ENV TZ=America/New_York
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --only=production

EXPOSE 8080

CMD ["npm", "start"]
