FROM node:22-alpine AS build

WORKDIR /app
COPY package.json ./
COPY scripts ./scripts
COPY public ./public
COPY data ./data
ARG VITE_APP_BASE_URL=https://limpopo.myward.khulanode.com
ARG VITE_GOOGLE_ADSENSE_CLIENT_ID=
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL
ENV VITE_GOOGLE_ADSENSE_CLIENT_ID=$VITE_GOOGLE_ADSENSE_CLIENT_ID
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
