FROM node

# Create app directory
RUN mkdir /app
WORKDIR /app

# Install app dependencies
COPY package.json ./

# Install libraries
RUN npm install

# Bundle app source
COPY . .

# Build dist folder
EXPOSE 4005
CMD [ "npm", "run", "start" ]