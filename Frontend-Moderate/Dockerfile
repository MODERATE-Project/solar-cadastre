FROM node:20.13 AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build --prod

EXPOSE 80

CMD ["npm", "start"]



FROM nginx:alpine AS prod
COPY --from=build /app/dist/angular_front /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
