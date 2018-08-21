FROM multiarch/alpine:armhf-edge
RUN apk add --no-cache nodejs nodejs-npm yarn
COPY . /app
WORKDIR /app
RUN yarn --production
EXPOSE 51113
CMD npm start
