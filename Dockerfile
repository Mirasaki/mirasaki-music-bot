FROM node:19-alpine

# Create app/working/bot directory
RUN mkdir -p /app
WORKDIR /app

# Install app production dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm ci --omit=dev

# Bundle app source
COPY . ./

# Optional API/Backend port
EXPOSE 3000

# Run the start command
CMD [ "npm", "run", "start" ]
