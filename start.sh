#!/usr/bin/env bash

# SchoolSense - One-Click Local Launcher
echo "=================================================="
echo "🚀 Starting SchoolSense Development Environment"
echo "=================================================="

# Function to kill child processes on Ctrl+C
cleanup() {
    echo ""
    echo "🛑 Shutting down servers..."
    kill $(jobs -p) 2>/dev/null
    exit
}
trap cleanup SIGINT SIGTERM

# 1. Start Backend Server
echo "📦 [1/2] Starting NestJS Backend Server on http://localhost:3000/api/v1..."
(cd backend && npm run start:dev) &

# 2. Start Frontend Server
echo "🌐 [2/2] Starting Angular Frontend Server on http://localhost:4300..."
(cd frontend && npx ng serve --port 4300 --host 0.0.0.0) &

# Wait for both processes
wait
