FROM node:16

COPY . ./app
WORKDIR /app

#RUN npm install -g @vue/cli
#RUN npm install

EXPOSE 5173

ENTRYPOINT [ "/bin/sh", "-c", "npm install && npm run dev" ]