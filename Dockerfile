FROM node:latest

WORKDIR /app/
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
ADD . .

ENV NODE_ENV production
RUN npm run build

# Getting env variables from app settings
# Running locally requires passing in via the -e flag

EXPOSE 80
CMD npm start

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
