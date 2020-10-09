FROM  node:12.16.2-alpine3.10
ENV PORT=1995
ENV BASE_URL='https://sigedin.itp.edu.co/api/'
ENV NODE_ENV='pro'
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm","start"]
