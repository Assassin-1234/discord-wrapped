FROM node:alpine3.17
WORKDIR /frontend
COPY . /frontend
RUN apk update
RUN apk add --no-progress --no-cache \ 
curl
ENV NODE_ENV "production"
RUN npm install && npm install -g typescript  
RUN npm run build
COPY .env.example .env
RUN rm -rf /frontend/Dockerfile /frontend/.env.example
HEALTHCHECK --interval=60s --timeout=10s CMD curl -s -f -o /dev/null http://localhost:5173 || exit 1
ENTRYPOINT ["http-server","-p 5173", "./dist"]