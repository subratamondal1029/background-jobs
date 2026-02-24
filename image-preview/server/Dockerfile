# Dev Dockerfile
FROM node:20-slim

WORKDIR /app

# pnpm support (critical)
RUN corepack enable

# Prevent node_modules overwrite by bind mount
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

EXPOSE 3000

CMD ["sh", "-c", "pnpm install && pnpm dev"]
