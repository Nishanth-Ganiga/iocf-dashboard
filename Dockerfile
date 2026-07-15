# Stage 1: build the React frontend into static files
FROM node:20-slim AS frontend-build
ENV CI=true
WORKDIR /app/web
RUN corepack enable && corepack prepare pnpm@9 --activate
COPY web/package.json ./
RUN pnpm install
COPY web/ ./
RUN pnpm run build

# Stage 2: run the Python server, which serves both the API and the
# built frontend from Stage 1.
FROM python:3.11-slim
WORKDIR /app
COPY server/requirements.txt server/requirements.txt
RUN pip install --no-cache-dir -r server/requirements.txt
COPY server/ server/
COPY --from=frontend-build /app/web/dist web/dist

EXPOSE 8787
CMD ["python3", "server/server.py"]
