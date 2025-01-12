#!/bin/bash

set -e  # Exit immediately if a command exits with a non-zero status

# Log DATABASE_URL for debugging
echo "DATABASE_URL: $DATABASE_URL"

# Parse the DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set."
  exit 1
fi

# Adjust regex to support `postgresql://` and `postgres://`
regex="^postgres(?:ql)?:\/\/([^:]+):([^@]+)@([^:\/]+)(?::([0-9]+))?\/(.+)$"
if [[ $DATABASE_URL =~ $regex ]]; then
  DB_USER="${BASH_REMATCH[1]}"
  DB_PASSWORD="${BASH_REMATCH[2]}"
  DB_HOST="${BASH_REMATCH[3]}"
  DB_PORT="${BASH_REMATCH[4]:-5432}"  # Default port 5432 if not provided
  DB_NAME="${BASH_REMATCH[5]}"
else
  echo "Error: DATABASE_URL format is invalid."
  exit 1
fi

echo "Parsed DATABASE_URL:"
echo "  DB_USER: $DB_USER"
echo "  DB_PASSWORD: [HIDDEN]"
echo "  DB_HOST: $DB_HOST"
echo "  DB_PORT: $DB_PORT"
echo "  DB_NAME: $DB_NAME"

echo "Waiting for PostgreSQL at $DB_HOST:$DB_PORT..."

# Wait until PostgreSQL is available
while ! PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
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