#!/bin/bash

echo "🚀 Starting Email Worker..."
echo "📧 Email Worker Only"
echo "===================="

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down email worker..."
    kill $EMAIL_PID 2>/dev/null
    echo "✅ Email worker stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Email Worker in background
echo "📧 Starting Email Worker..."
npm run worker:email &
EMAIL_PID=$!
echo "📧 Email Worker started with PID: $EMAIL_PID"

echo ""
echo "✅ Email worker is running!"
echo "📧 Email Worker PID: $EMAIL_PID"
echo ""
echo "💡 Press Ctrl+C to stop email worker"
echo "🔍 Check dashboard at: http://localhost:3000/admin/queues"
echo ""

# Wait for process
wait
