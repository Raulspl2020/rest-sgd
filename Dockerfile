FROM  node:12.16.2-alpine3.10
ENV NODE_ENV='pro'
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm","start"]
