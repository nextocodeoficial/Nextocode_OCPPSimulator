FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

# Vite inlines these at build time; override with --build-arg.
ARG VITE_DEFAULT_CSMS_URL=
ARG VITE_BASE_URL=
ENV VITE_DEFAULT_CSMS_URL=$VITE_DEFAULT_CSMS_URL \
    VITE_BASE_URL=$VITE_BASE_URL

RUN yarn build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

