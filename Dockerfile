FROM nodesource/node:6

# Make sure to run 'npm run build' first

ENV NODE_ENV production

RUN apt-get update
RUN apt-get install -y graphicsmagick

ADD package.json package.json
RUN npm install
ADD . .

# Getting env variables from app settings
# Running locally requires passing in via the -e flag

CMD export AZURE_STORAGE_ACCOUNT=$AZURE_STORAGE_ACCOUNT && export AZURE_STORAGE_ACCESS_KEY=$AZURE_STORAGE_ACCESS_KEY && npm start

RUN apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*