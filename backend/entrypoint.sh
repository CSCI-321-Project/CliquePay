#!/bin/sh

# Wait for database
echo "Waiting for MySQL..."
until nc -z "$DB_HOST" "$DB_PORT" || [ $count -eq $max_retries ]; do
    echo "Attempt $count: MySQL is unavailable - sleeping"
    count=$((count+1))
    sleep 2
done

# Apply database migrations
python manage.py migrate

# Start server
gunicorn backend.wsgi:application --bind 0.0.0.0:8000 --workers 3