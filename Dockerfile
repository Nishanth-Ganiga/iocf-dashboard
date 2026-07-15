# Stage 1: build the React frontend into static files
FROM node:20-slim AS frontend-build
WORKDIR /app/web
COPY web/package.json web/package-lock.json ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

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
