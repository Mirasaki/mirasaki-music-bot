FROM node:19

# Create app/working/bot directory
RUN mkdir -p /app
WORKDIR /app

# Before installing ytdl mod, install ffmpeg
RUN apt-get update && apt-get install 'ffmpeg' -y

# Install app development dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
RUN npm install --include=dev

# Bundle app source
COPY . ./

# API port
EXPOSE 3000

# Show current folder structure in logs
# RUN ls -al -R

# Run the start command
CMD [ "npx", "nodemon", "--inspect=0.0.0.0:9229", "src/index.js" ]
