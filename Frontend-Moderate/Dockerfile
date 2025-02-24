FROM node:20.13 AS build

ARG ARCGIS_TOKEN

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN sed -i "s|__TOKEN__|${ARCGIS_TOKEN}|g" src/environments/environment.prod.ts

RUN npm run build --prod

CMD ["npm", "start"]



FROM nginx:alpine AS prod

COPY --from=build /app/dist/angular_front /usr/share/nginx/html
COPY default.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
