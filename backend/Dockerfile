# Use Python 3.12 slim image
FROM python:3.11-slim

# Declare build arguments for AWS credentials
ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY
ARG AWS_STORAGE_BUCKET_NAME
ARG AWS_S3_REGION_NAME
ARG AWS_PRESIGNED_EXPIRY

# Set environment variables using the build arguments
ENV AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
ENV AWS_STORAGE_BUCKET_NAME=$AWS_STORAGE_BUCKET_NAME
ENV AWS_S3_REGION_NAME=$AWS_S3_REGION_NAME
ENV AWS_PRESIGNED_EXPIRY=$AWS_PRESIGNED_EXPIRY

# Set other environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DJANGO_SETTINGS_MODULE=clm.settings \
    DEBUG=True \
    SECRET_KEY=dummy-key-for-collectstatic \
    DATABASE_URL=postgres://dummy:dummy@dummy:5432/dummy

# Set working directory
WORKDIR /app

# Install essential build dependencies (no GDAL/GEOS)
RUN apt-get update && apt-get install -y \
    curl \
    gnupg2 \
    software-properties-common \
    && rm -rf /var/lib/apt/lists/*

# Add PostgreSQL repository
RUN sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list' \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

# Install main dependencies (exclude GDAL/GEOS)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    postgresql-client-15 \
    binutils \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Create static directories
RUN mkdir -p static staticfiles

# Set permissions for the entrypoint script
RUN chmod +x entrypoint.sh

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Expose the port that Cloud Run expects
EXPOSE 8080

# Use entrypoint script
ENTRYPOINT ["./entrypoint.sh"]
