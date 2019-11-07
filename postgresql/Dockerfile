FROM node:12.9.0-alpine
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install &&\
    apk update &&\
    apk upgrade
COPY . .
EXPOSE  8080
CMD ["npm", "start"]
