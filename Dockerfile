FROM node:12.18.3-alpine3.9

RUN apk add --no-cache \
    sudo \
    curl \
    build-base \
    g++ \
    libpng \
    libpng-dev \
    jpeg-dev \
    pango-dev \
    cairo-dev \
    giflib-dev \
    python \
    ;

RUN npm install -g html-pdf



ENV NODE_ENV='pro'
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm","start"]
