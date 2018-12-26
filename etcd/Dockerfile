FROM node:10.14.1-alpine
COPY package*.json ./
RUN npm install &&\
    apk update &&\
    apk upgrade
COPY . .
EXPOSE  8080
CMD ["npm", "start"]
