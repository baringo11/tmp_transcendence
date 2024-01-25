FROM node:16

COPY . ./app
WORKDIR /app

RUN npm i -g @nestjs/cli
#RUN npm install

EXPOSE 3000

ENTRYPOINT [ "/bin/sh", "-c", "npm install && npm run start:dev" ]