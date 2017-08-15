FROM nodesource/node:latest

# Make sure to run 'npm run build' first

ENV NODE_ENV production

RUN apt-get update
RUN apt-get install -y graphicsmagick

RUN npm install -g n
RUN n latest
ADD package.json package.json
RUN npm install
ADD . .

# Getting env variables from app settings
# Running locally requires passing in via the -e flag

CMD npm start

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
