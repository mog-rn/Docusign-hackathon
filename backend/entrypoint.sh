#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

echo "Waiting for PostgreSQL..."

# Wait until PostgreSQL is available
until python -c "
import psycopg2
from urllib.parse import urlparse
url = urlparse('$DATABASE_URL')
conn = psycopg2.connect(
    dbname=url.path[1:],
    user=url.username,
    password=url.password,
    host=url.hostname,
    port=url.port
)
conn.close()
"; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing migrations"

# Apply migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Collect static files (optional)
if [[ "$COLLECT_STATIC" == "1" ]]; then
  echo "Collecting static files..."
  python manage.py collectstatic --noinput
fi

# Start Gunicorn server
echo "Starting Gunicorn..."
exec gunicorn clm.wsgi:application \
    --bind 0.0.0.0:$PORT \
    --workers 3 \
    --threads 2 \
    --timeout 0
