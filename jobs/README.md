# Bull Framework Implementation

## 🎯 Overview

This project uses **Bull** framework with **Redis** to handle asynchronous job processing for better performance, reliability, and scalability.

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Server    │    │   Redis Queue   │    │   Worker(s)     │
│                 │    │                 │    │                 │
│ • Create jobs   │───▶│ • Store jobs    │───▶│ • Process jobs  │
│ • Return fast   │    │ • Handle retry  │    │ • Send emails   │
│ • No blocking   │    │ • Persist data  │    │ • Generate      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 File Structure

```
jobs/
├── queues/                    # Queue definitions
│   ├── email.queue.ts        # Email processing queue
│   └── voucher.queue.ts      # Voucher processing queue
├── worker/                   # Job processors
│   ├── email.worker.ts       # Email job processor
│   └── voucher.worker.ts     # Voucher job processor
├── services/                 # Business logic
│   └── email.service.ts      # Email sending service
└── README.md                 # This file
```

## 🚀 Available Queues

### 1. **Email Queue** (`email.queue.ts`)
- **Purpose**: Process email sending jobs
- **Jobs**: Send voucher emails, notifications
- **Retry**: 3 attempts with exponential backoff
- **Priority**: Normal

### 2. **Voucher Queue** (`voucher.queue.ts`)
- **Purpose**: Process voucher-related jobs
- **Jobs**: Voucher processing, reporting, CRM sync
- **Retry**: 3 attempts with exponential backoff
- **Priority**: High (1)

## 🔧 Configuration

### Environment Variables
```bash
# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Queue Options
```typescript
const queue = new Bull('queueName', {
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379
  },
  defaultJobOptions: {
    attempts: 3,                    // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',          // Exponential backoff
      delay: 2000                   // Start with 2 seconds
    },
    removeOnComplete: 100,          // Keep last 100 completed jobs
    removeOnFail: 50,               // Keep last 50 failed jobs
    delay: 0,                       // No initial delay
    priority: 1                     // Job priority
  }
});
```

## 📊 Monitoring & Dashboard

### Bull Board Dashboard
- **URL**: `/admin/queues`
- **Features**: Real-time queue monitoring, job management
- **Access**: No authentication required (can be added)

### API Endpoints
```bash
# Get queue status
GET /admin/queues/status

# Clean failed jobs
POST /admin/queues/{queueName}/clean-failed

# Retry failed jobs
POST /admin/queues/{queueName}/retry-failed

# Pause/Resume queue
POST /admin/queues/{queueName}/{action}

# Add test job
POST /admin/queues/voucher/test-job
```

## 📊 **Bull Board Dashboard**

Bull Board cung cấp giao diện web đẹp để monitor và quản lý queues. Chúng ta có cả **UI Dashboard** và **API endpoints**.

### **🎨 UI Dashboard:**
```
http://localhost:3000/admin/queues
```

**Features:**
- 📊 Real-time queue statistics (waiting, active, completed, failed)
- ⏸️ Pause/Resume queues
- 🔄 Retry failed jobs
- 🗑️ Clean failed jobs
- 🧪 Create test jobs (voucher queue)
- 🔄 Auto-refresh every 10 seconds
- 📱 Responsive design

### **🔧 API Endpoints:**

#### **1. Queue Status**
```bash
# Get all queues status
GET /admin/queues/api/status

# Get specific queue status  
GET /admin/queues/api/{queueName}/status
# queueName: 'email' | 'voucher'
```

#### **2. Queue Management**
```bash
# Clean failed jobs
POST /admin/queues/api/{queueName}/clean-failed

# Retry failed jobs
POST /admin/queues/api/{queueName}/retry-failed

# Pause/Resume queue
POST /admin/queues/api/{queueName}/{action}
# action: 'pause' | 'resume'
```

#### **3. Testing**
```bash
# Create test job in voucher queue
POST /admin/queues/api/voucher/test-job
```

### **📱 Example Usage:**

```bash
# Check all queues
curl http://localhost:3000/admin/queues/api/status

# Check voucher queue specifically
curl http://localhost:3000/admin/queues/api/voucher/status

# Pause email queue
curl -X POST http://localhost:3000/admin/queues/api/email/pause

# Resume voucher queue  
curl -X POST http://localhost:3000/admin/queues/api/voucher/resume

# Clean failed jobs
curl -X POST http://localhost:3000/admin/queues/api/email/clean-failed
```

### **🔍 Response Format:**

```json
{
  "success": true,
  "data": {
    "email": {
      "name": "email",
      "counts": {
        "waiting": 5,
        "active": 2,
        "completed": 100,
        "failed": 3
      },
      "isPaused": false
    },
    "voucher": {
      "name": "voucher",
      "counts": {
        "waiting": 0,
        "active": 1,
        "completed": 50,
        "failed": 0
      },
      "isPaused": false
    }
  }
}
```

## 🎯 Best Practices

### **Single Job Pattern (Recommended)**
Instead of creating multiple separate jobs for different tasks, create **ONE comprehensive job** that handles the complete workflow:

```typescript
// ❌ DON'T: Multiple separate jobs
await addVoucherJob({ eventId, userId, voucherCode, email }); // Voucher processing
await emailQueue.add({ to: email, code: voucherCode });        // Email sending

// ✅ DO: Single comprehensive job
await addVoucherJob({
  eventId,
  userId, 
  voucherCode,
  email,
  action: 'issue_and_notify' // Handles both voucher + email
});
```

### **Benefits of Single Job Pattern**
1. **Atomic Operations**: All related tasks succeed or fail together
2. **Easier Tracking**: One job ID for the entire workflow
3. **Better Error Handling**: Retry logic applies to the complete process
4. **Simplified Monitoring**: Single job status instead of multiple
5. **Consistent State**: No partial completion scenarios

### **Job Action Types**
```typescript
interface VoucherJobData {
  eventId: string;
  userId: string;
  voucherCode: string;
  email: string;
  action?: 'issue_and_notify' | 'process_only' | 'email_only';
}
```

- **`issue_and_notify`**: Complete voucher processing + email (default)
- **`process_only`**: Only voucher processing, no email
- **`email_only`**: Only email notification, no processing

## 🎫 Usage Examples

### Adding Jobs to Queue
```typescript
import { addVoucherJob } from '../jobs/queues/voucher.queue';

// Add voucher processing job
const job = await addVoucherJob({
  eventId: 'event123',
  userId: 'user456',
  voucherCode: 'VC123456',
  email: 'user@example.com'
});

console.log(`Job added: ${job.id}`);
```

### Processing Jobs in Worker
```typescript
voucherQueue.process(async (job) => {
  const { eventId, userId, voucherCode, email } = job.data;
  
  try {
    // Process the voucher
    const result = await processVoucher(eventId, userId, voucherCode);
    
    // Send email notification
    await sendVoucherEmail(email, voucherCode);
    
    return result;
  } catch (error) {
    // Job will be retried automatically
    throw error;
  }
});
```

## 🚀 **Worker System**

### **📁 Worker Files:**
- `jobs/worker/email.worker.ts` - Email processing worker
- `jobs/worker/voucher.worker.ts` - Voucher processing worker

### **🔄 Running Workers:**

#### **1. Individual Workers:**
```bash
# Run email worker only
npm run worker:email

# Run voucher worker only  
npm run worker:voucher

# Or use scripts directly
bash run-worker.sh        # Email worker
bash run-voucher-worker.sh # Voucher worker
```

#### **2. All Workers Together:**
```bash
# Run both workers simultaneously
npm run workers

# Or use script directly
bash run-all-workers.sh
```

#### **3. Manual Background Process:**
```bash
# Terminal 1: Email Worker
npm run worker:email &

# Terminal 2: Voucher Worker  
npm run worker:voucher &

# Check running processes
ps aux | grep worker
```

### **🎯 Worker Features:**

#### **Email Worker:**
- Processes email queue jobs
- Handles email sending
- Automatic retry on failure
- Job monitoring and cleanup

#### **Voucher Worker:**
- Processes voucher queue jobs
- Handles voucher processing
- Supports different job actions:
  - `issue_and_notify`: Complete workflow
  - `process_only`: Voucher processing only
  - `email_only`: Email notification only
- Automatic retry on failure

### **📊 Monitoring Workers:**

#### **Dashboard:**
```
http://localhost:3000/admin/queues
```

#### **API Endpoints:**
```bash
# Check all queues status
curl http://localhost:3000/admin/queues/api/status

# Check specific queue
curl http://localhost:3000/admin/queues/api/email/status
curl http://localhost:3000/admin/queues/api/voucher/status
```

### **🔧 Worker Management:**

#### **Start/Stop:**
```bash
# Start all workers
npm run workers

# Stop all workers (Ctrl+C)
# Script will automatically clean up processes
```

#### **Process Management:**
```bash
# Check worker PIDs
ps aux | grep -E "(email|voucher).worker"

# Kill specific worker
kill <PID>

# Kill all workers
pkill -f "voucher.worker\|email.worker"
```

### **📝 Logs:**
Workers log to console with structured logging:
- Job start/completion
- Error handling
- Retry attempts
- Queue statistics

## 🔍 Job Lifecycle

```
1. Job Created → Added to queue
2. Job Waiting → In queue, waiting for worker
3. Job Active → Being processed by worker
4. Job Completed → Successfully processed
5. Job Failed → Failed, will retry (if attempts < max)
6. Job Removed → Cleaned up after retention period
```

## 🛡️ Error Handling & Retry

### Automatic Retry
- Failed jobs are automatically retried
- Exponential backoff prevents overwhelming the system
- Maximum 3 attempts before permanent failure

### Manual Retry
```bash
# Retry all failed jobs in a queue
POST /admin/queues/email/retry-failed
POST /admin/queues/voucher/retry-failed
```

### Cleanup
```bash
# Clean failed jobs
POST /admin/queues/email/clean-failed
POST /admin/queues/voucher/clean-failed
```

## 📈 Performance Benefits

### Before Bull (Synchronous)
```
User Request → Create Voucher → Send Email → Generate Report → Return Response
     ↓              ↓              ↓              ↓              ↓
   Fast          Fast          Slow (2-5s)    Slow (1-3s)    Slow (3-8s total)
```

### After Bull (Asynchronous)
```
User Request → Create Voucher → Add Job to Queue → Return Response (Fast!)
     ↓              ↓              ↓                    ↓
   Fast          Fast          Very Fast            Very Fast (<100ms)
                                    ↓
                              Worker processes job in background
```

## 🔧 Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   ```bash
   # Check Redis is running
   redis-cli ping
   
   # Check environment variables
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

2. **Worker Not Processing Jobs**
   ```bash
   # Check worker logs
   npm run worker:voucher
   
   # Check queue status
   GET /admin/queues/status
   ```

3. **Jobs Stuck in Queue**
   ```bash
   # Pause and resume queue
   POST /admin/queues/voucher/pause
   POST /admin/queues/voucher/resume
   ```

### Monitoring Commands
```bash
# Check Redis keys
redis-cli keys "*bull*"

# Monitor Redis operations
redis-cli monitor

# Check queue lengths
redis-cli llen bull:voucherQueue:wait
redis-cli llen bull:voucherQueue:active
```

## 🚀 Scaling

### Multiple Workers
```bash
# Start multiple voucher workers
npm run worker:voucher  # Worker 1
npm run worker:voucher  # Worker 2
npm run worker:voucher  # Worker 3
```

### Load Balancing
- Bull automatically distributes jobs across available workers
- No additional configuration needed
- Workers can be added/removed dynamically

## 📚 Best Practices

1. **Job Data**: Keep job data small, store large data in database
2. **Error Handling**: Always handle errors in job processors
3. **Monitoring**: Use Bull Board dashboard for production monitoring
4. **Cleanup**: Configure appropriate job retention periods
5. **Logging**: Log important job events for debugging
6. **Testing**: Test job processing with test data

## 🔗 Related Documentation

- [Bull Documentation](https://github.com/OptimalBits/bull)
- [Bull Board Documentation](https://github.com/felixmosh/bull-board)
- [Redis Documentation](https://redis.io/documentation)
- [Hapi.js Documentation](https://hapi.dev/)

---

**🎉 Bull framework provides a robust, scalable solution for background job processing!**
