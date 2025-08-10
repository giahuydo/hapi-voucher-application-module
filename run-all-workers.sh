#!/bin/bash

echo "🚀 Starting All Workers..."
echo "📧 Email Worker + 🎫 Voucher Worker"
echo "=================================="

# Function to handle cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down all workers..."
    kill $EMAIL_PID $VOUCHER_PID 2>/dev/null
    echo "✅ All workers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start Email Worker in background
echo "📧 Starting Email Worker..."
npm run worker:email &
EMAIL_PID=$!
echo "📧 Email Worker started with PID: $EMAIL_PID"

# Start Voucher Worker in background
echo "🎫 Starting Voucher Worker..."
npm run worker:voucher &
VOUCHER_PID=$!
echo "🎫 Voucher Worker started with PID: $VOUCHER_PID"

echo ""
echo "✅ All workers are running!"
echo "📧 Email Worker PID: $EMAIL_PID"
echo "🎫 Voucher Worker PID: $VOUCHER_PID"
echo ""
echo "💡 Press Ctrl+C to stop all workers"
echo "🔍 Check dashboard at: http://localhost:3000/admin/queues"
echo ""

# Wait for both processes
wait
