FROM node:20-alpine3.18
COPY . /usr/src/sigils-server
WORKDIR /usr/src/sigils-server
RUN npm install --include=dev
RUN npm run build
CMD ["npm", "start"]
EXPOSE 3000