FROM node:10.16.3
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 9081
RUN pwd
CMD ["npm", "start"]