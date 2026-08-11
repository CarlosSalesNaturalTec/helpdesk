# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache openssl

# Copy workspace configuration and package files for dependency installation
COPY package.json package-lock.json ./
COPY shared/package.json shared/tsconfig.json shared/
COPY backend/package.json backend/tsconfig.json backend/
COPY prisma/ prisma/

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Ensure nested node_modules directories exist so COPY doesn't fail later
RUN mkdir -p /app/backend/node_modules /app/shared/node_modules

# Copy source code
COPY shared/src/ shared/src/
COPY backend/src/ backend/src/

# Generate Prisma client BEFORE building (TypeScript needs the generated types)
# NODE_TLS_REJECT_UNAUTHORIZED is needed in corporate networks with SSL inspection
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

# Build shared first (backend depends on it)
RUN npm run build --workspace=shared

# Build backend
RUN npm run build --workspace=backend

# Stage 2: Runtime
FROM node:20-alpine AS runtime

WORKDIR /app

# Instalar OpenSSL (necessário para o Prisma no Alpine)
RUN apk add --no-cache openssl

# Copy workspace configuration
COPY --from=build /app/package.json /app/package-lock.json ./

# Copy shared package (dist + package.json for workspace resolution)
COPY --from=build /app/shared/package.json /app/shared/
COPY --from=build /app/shared/dist/ /app/shared/dist/

# Copy backend package and compiled output
COPY --from=build /app/backend/package.json /app/backend/
COPY --from=build /app/backend/dist/ /app/backend/dist/

# Copy backend static assets (e.g. logo-print.png used by PDFKit reports),
# read at runtime relative to dist/ — see LOGO_PRINT_PATH in routes/reports.ts
COPY --from=build /app/backend/src/assets/ /app/backend/src/assets/

# Copy all root node_modules (preserves workspace symlinks)
COPY --from=build /app/node_modules/ /app/node_modules/

# Copy nested node_modules (which are guaranteed to exist now)
COPY --from=build /app/backend/node_modules/ /app/backend/node_modules/
COPY --from=build /app/shared/node_modules/ /app/shared/node_modules/

# Copy Prisma schema and generated client
COPY --from=build /app/prisma/ /app/prisma/

ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node backend/dist/index.js"]
