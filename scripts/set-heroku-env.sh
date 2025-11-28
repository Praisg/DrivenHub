#!/bin/bash

# Set Supabase environment variables in Heroku
# Usage: ./scripts/set-heroku-env.sh <app-name>

APP_NAME=${1:-"38572a84c4"}

echo "Setting environment variables for Heroku app: $APP_NAME"

# Set Supabase URL
heroku config:set NEXT_PUBLIC_SUPABASE_URL="https://wbleojuizxhjojwhhfqo.supabase.co" --app "$APP_NAME"

# Set Supabase Anon Key
heroku config:set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndibGVvanVpenhoam9qd2hoZnFvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NDgwMDcsImV4cCI6MjA3OTMyNDAwN30.zhkjpNqekjA6btMTtOTK7MRrC8FFpGvGCPBIeFmGPZM" --app "$APP_NAME"

echo "Environment variables set successfully!"
echo "Restarting dynos..."
heroku restart --app "$APP_NAME"

echo "Done! Your app should now have access to Supabase."

