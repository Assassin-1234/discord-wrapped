FROM node:lts

WORKDIR /backend

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get install -y \
    dumb-init \
    xvfb \
    ffmpeg

RUN rm /bin/sh && ln -s /bin/bash /bin/sh

RUN apt-get update \
    && apt-get install -y curl \
    && apt-get -y autoclean

ENV NODE_ENV "production"

RUN apt-get update && apt-get -qqy install \ 
build-essential python3 python-is-python3 libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libxi-dev libglu1-mesa-dev libglew-dev ffmpeg

COPY package.json /backend/
COPY tsconfig.json /backend/
RUN npm install -g typescript@4.9.5 && npm install --location=project

COPY . /backend/
RUN npm run build
COPY .env.example .env
RUN rm -rf /backend/Dockerfile /backend/.env.example

EXPOSE 3020
ENTRYPOINT ["/usr/bin/dumb-init", "--", "xvfb-run", "--server-args", "-screen 0 1280x1024x24 -ac"]
CMD ["npm", "run", "start"]