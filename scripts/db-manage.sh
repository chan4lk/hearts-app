#!/bin/bash

# Function to display help
show_help() {
  echo "Database Management Script"
  echo "Usage: ./db-manage.sh [command]"
  echo ""
  echo "Commands:"
  echo "  start       - Start the database and pgAdmin"
  echo "  stop        - Stop the database and pgAdmin"
  echo "  restart     - Restart the database and pgAdmin"
  echo "  status      - Show the status of containers"
  echo "  logs        - Show logs from containers"
  echo "  reset       - Reset the database (delete all data)"
  echo "  migrate     - Run Prisma migrations"
  echo "  seed        - Seed the database with initial data"
  echo "  help        - Show this help message"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
  echo "Error: Docker is not installed. Please install Docker first."
  exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
  echo "Error: Docker Compose is not installed. Please install Docker Compose first."
  exit 1
fi

# Process commands
case "$1" in
  start)
    echo "Starting database and pgAdmin..."
    docker-compose up -d
    echo "Database is running at localhost:5432"
    echo "pgAdmin is available at http://localhost:5050"
    echo "Login with admin@example.com / admin"
    ;;
  stop)
    echo "Stopping database and pgAdmin..."
    docker-compose down
    ;;
  restart)
    echo "Restarting database and pgAdmin..."
    docker-compose restart
    ;;
  status)
    echo "Container status:"
    docker-compose ps
    ;;
  logs)
    echo "Container logs:"
    docker-compose logs
    ;;
  reset)
    echo "Resetting database (this will delete all data)..."
    docker-compose down -v
    docker-compose up -d
    echo "Database reset complete. Running migrations..."
    npx prisma migrate reset --force
    ;;
  migrate)
    echo "Running Prisma migrations..."
    npx prisma migrate dev
    ;;
  seed)
    echo "Seeding database with initial data..."
    npx prisma db seed
    ;;
  help|*)
    show_help
    ;;
esac 