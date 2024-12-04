FROM node:21.1.0

WORKDIR /usr/src/app

COPY package*.json ./
COPY .npmrc ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 4007

CMD ["npm", "start"]

