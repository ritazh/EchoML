FROM node:8

WORKDIR /app/
COPY ./package.json .
COPY ./package-lock.json .
RUN npm install
ADD . .

RUN npm run build

EXPOSE 80
CMD npm run prod
