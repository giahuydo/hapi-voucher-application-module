#!/bin/bash

echo "🚀 Starting Voucher Worker..."
echo "🎫 Processing voucher jobs from queue..."

# Run the voucher worker
ts-node jobs/worker/voucher.worker.ts
