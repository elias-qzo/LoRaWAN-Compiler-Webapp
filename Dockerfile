FROM node:22.13.1-slim

WORKDIR /usr/src/app

COPY package*.json ./

# Install without dev dependecies and empty npm cache
RUN npm install --only=production && npm cache clean --force

COPY . .

ENV PORT=4050
EXPOSE ${PORT}

CMD ["npm", "start"]