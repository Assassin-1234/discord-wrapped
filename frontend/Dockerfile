FROM node:alpine3.17
WORKDIR /backend
COPY . /backend
RUN apk update
RUN apk add --no-progress --no-cache \ 
curl
RUN adduser -D -g 'www' www
ENV NODE_ENV "production"
RUN npm install && npm install -g typescript http-server
RUN npm run build
COPY .env.example .env
RUN rm -rf /backend/Dockerfile /backend/.env.example
HEALTHCHECK --interval=60s --timeout=10s CMD curl -s -f -o /dev/null http://localhost:3020 || exit 1
ENTRYPOINT ["http-server","-p 3020", "./dist"]