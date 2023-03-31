FROM node:lts
WORKDIR /backend
COPY . /backend
RUN apt-get update && apt-get -qqy install build-essential python3 python-is-python3 libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libxi-dev libglu1-mesa-dev libglew-dev ffmpeg
ENV NODE_ENV "production"
RUN npm install --location=project
RUN npm run build
COPY .env.example .env
RUN rm -rf /backend/Dockerfile /backend/.env.example

HEALTHCHECK --interval=60s --timeout=10s CMD curl -s -f -o /dev/null http://localhost:3020 || exit 1
ENTRYPOINT ["npm", "run", "start"]