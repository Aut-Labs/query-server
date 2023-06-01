FROM node:16.19.1

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json ./
COPY .npmrc ./

# Install libraries
RUN npm install -g npm@latest
RUN npm install
RUN npm install -g typescript@4.6.2
RUN npm install reflect-metadata
RUN npm rebuild canvas --update-binary
RUN npm install --save-dev @types/node
RUN chown -R 1000:1000 "/root/.npm"

# Bundle app source
COPY . .

# Build dist folder
EXPOSE 4005
CMD ["npm", "run", "start" ]

