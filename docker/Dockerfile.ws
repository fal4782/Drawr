FROM node:20-alpine

WORKDIR /user/src/app

# Install pnpm globally
RUN npm install -g pnpm


COPY ./packages ./packages
COPY ./pnpm-lock.yaml ./pnpm-lock.yaml

COPY ./package.json ./package.json
COPY ./turbo.json ./turbo.json

COPY ./apps/ws-backend ./apps/ws-backend

RUN pnpm install
RUN pnpm run db:generate

EXPOSE 8081

CMD [ "pnpm", "run", "start:ws" ]