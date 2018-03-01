FROM node:latest
COPY package.json .
RUN npm install
ENV NODE_ENV production
RUN npm install -g forever
COPY . .
EXPOSE 3001
CMD [ "forever", "server.js" ]

