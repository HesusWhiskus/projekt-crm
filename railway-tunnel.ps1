# Railway SSH Tunnel Script
# This script creates an SSH tunnel to Railway PostgreSQL database

$ErrorActionPreference = "Stop"

Write-Host "Starting Railway SSH tunnel to PostgreSQL..."
Write-Host "This will run in the background. Press Ctrl+C to stop."

# Railway SSH automatically creates tunnel when connecting
# We'll use Railway connect to establish connection
railway connect postgres









