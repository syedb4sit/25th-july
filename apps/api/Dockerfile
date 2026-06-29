# apps/api/Dockerfile
FROM node:20-alpine AS builder
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
# Set working directory
WORKDIR /app

# Install turbo
RUN npm install -g turbo

# Copy all source files
COPY . .

# Prune the workspace for the api app
RUN turbo prune --scope=@25th-july/api --docker

# --- Next stage ---
FROM node:20-alpine AS installer
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies (only what's needed for api)
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/package-lock.json ./package-lock.json
RUN npm ci

# Copy the rest of the pruned source code
COPY --from=builder /app/out/full/ .

# Generate Prisma Client
RUN cd packages/db && npx prisma generate

# Build the project
RUN npx turbo run build --filter=@25th-july/api...

# --- Final stage ---
FROM node:20-alpine AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 api_user
USER api_user

# Copy only what's needed to run the app
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/packages ./packages
COPY --from=installer /app/apps/api/package.json ./apps/api/package.json
COPY --from=installer /app/apps/api/dist ./apps/api/dist

# Expose port
EXPOSE 3001

CMD ["node", "apps/api/dist/index.js"]
