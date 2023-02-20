FROM node

# Create app directory
RUN mkdir /app
WORKDIR /app

# Install app dependencies
COPY package.json ./
COPY .npmrc ./

# Install libraries
RUN npm install
RUN npm install -g typescript@4.6.2

# Bundle app source
COPY . .

# Build dist folder
EXPOSE 4005
CMD [ "npm", "run", "start" ]