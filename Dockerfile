#FROM sigedin/base
FROM node:18.12.1-slim AS deps

RUN mkdir -p /app
WORKDIR /app
COPY package.json tsconfig.json /app/

RUN npm install


FROM node:18.12.1-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18.12.1-slim AS runner

WORKDIR /usr/src/app

RUN apt-get update \
  && apt-get install -y wget gnupg \
  && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
  && apt-get update \
  && apt-get install -y google-chrome-stable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV PATH /usr/app/node_modules/.bin:$PATH
ENV TZ=America/Bogota
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

ENV CHROME_BIN="/usr/bin/google-chrome"
ENV PUPPETEER_SKIP_DOWNLOAD="true"

COPY package.json package-lock.json ./
RUN npm install --omit=dev
COPY . .
COPY --from=builder /app/dist ./dist
COPY *.env .

CMD ["node","dist/app"]
