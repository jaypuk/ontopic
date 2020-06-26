FROM node:latest

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

#CMD [ "node", "./cli.js" ]
CMD [ "node", "./cli.js", "arn:aws:sns:eu-west-1:000000000000:cdc_development-user_S1UserEntitiesUser" ]

