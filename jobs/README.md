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
│ • No blocking   │    │ • Persist data  │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 File Structure

```
jobs/
├── queues/                    # Queue definitions
│   └── email.queue.ts        # Email processing queue
├── worker/                   # Job processors
│   └── email.worker.ts       # Email job processor
├── services/                 # Business logic
│   └── email.service.ts      # Email sending service
└── README.md                 # This file
```

## 🚀 Available Queues

### 1. **Email Queue** (`email.queue.ts`)
- **Purpose**: Process email sending jobs including voucher notifications
- **Jobs**: Send voucher emails, notifications
- **Retry**: 3 attempts with exponential backoff
- **Priority**: Normal

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
    delay: 0                        // No initial delay
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
POST /admin/queues/email/test-job
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
- 🧪 Create test jobs (email queue)
- 🔄 Auto-refresh every 10 seconds
- 📱 Responsive design

### **🔧 API Endpoints:**

#### **1. Queue Status**
```bash
# Get all queues status
GET /admin/queues/api/status

# Get specific queue status  
GET /admin/queues/api/{queueName}/status
# queueName: 'email'
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
# Create test job in email queue
POST /admin/queues/api/email/test-job
```

### **📱 Example Usage:**

```bash
# Check all queues
curl http://localhost:3000/admin/queues/api/status

# Check email queue specifically
curl http://localhost:3000/admin/queues/api/email/status

# Pause email queue
curl -X POST http://localhost:3000/admin/queues/api/email/pause

# Resume email queue  
curl -X POST http://localhost:3000/admin/queues/api/email/resume

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
    }
  }
}
```

## 🎯 Best Practices

### **Voucher Processing Pattern**
Vouchers are created immediately in the database, and email notifications are sent asynchronously:

```typescript
// ✅ DO: Create voucher immediately, send email asynchronously
const code = await issueVoucherCore(eventId, userId, session);
await session.commitTransaction();

// Send email notification via queue (non-blocking)
await sendVoucherNotificationEmail(userId, code);

return { code }; // Return voucher code immediately
```

### **Benefits of This Pattern**
1. **Fast Response**: User gets voucher code immediately
2. **Reliable Storage**: Voucher is saved in database before email
3. **Non-blocking**: Email sending doesn't delay response
4. **Retry Capability**: Failed emails can be retried automatically
5. **Scalable**: Multiple email workers can process queue

## 🎫 Usage Examples

### Adding Jobs to Queue
```typescript
import emailQueue from '../jobs/queues/email.queue';

// Add voucher notification email job
const job = await emailQueue.add('send-voucher-email', {
  to: 'user@example.com',
  code: 'VC123456'
});

console.log(`Email job added: ${job.id}`);
```

### Processing Jobs in Worker
```typescript
emailQueue.process(async (job) => {
  const { to, code } = job.data;
  
  try {
    // Send voucher email
    const result = await sendEmail({ to, code });
    
    if (result.success) {
      return result;
    } else {
      throw new Error(result.error || 'Email sending failed');
    }
  } catch (error) {
    // Job will be retried automatically
    throw error;
  }
});
```

## 🚀 **Worker System**

### **📁 Worker Files:**
- `jobs/worker/email.worker.ts` - Email processing worker

### **🔄 Running Workers:**

#### **1. Individual Workers:**
```bash
# Run email worker only
npm run worker:email

# Or use scripts directly
bash run-worker.sh        # Email worker
```

#### **2. Manual Background Process:**
```bash
# Terminal 1: Email Worker
npm run worker:email &

# Check running processes
ps aux | grep worker
```

### **🎯 Worker Features:**

#### **Email Worker:**
- Processes email queue jobs
- Handles email sending including voucher notifications
- Automatic retry on failure
- Job monitoring and cleanup

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
```

### **🔧 Worker Management:**

#### **Start/Stop:**
```bash
# Start email worker
npm run worker:email

# Stop worker (Ctrl+C)
# Script will automatically clean up processes
```

#### **Process Management:**
```bash
# Check worker PIDs
ps aux | grep -E "email.worker"

# Kill specific worker
kill <PID>

# Kill all workers
pkill -f "email.worker"
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
```

### Cleanup
```bash
# Clean failed jobs
POST /admin/queues/email/clean-failed
```

## 📈 Performance Benefits

### Before Bull (Synchronous)
```
User Request → Create Voucher → Send Email → Return Response
     ↓              ↓              ↓              ↓
   Fast          Fast          Slow (2-5s)    Slow (2-5s total)
```

### After Bull (Asynchronous)
```
User Request → Create Voucher → Add Email Job to Queue → Return Response (Fast!)
     ↓              ↓              ↓                    ↓
   Fast          Fast          Very Fast            Very Fast (<100ms)
                                    ↓
                              Worker processes email in background
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
   npm run worker:email
   
   # Check queue status
   GET /admin/queues/status
   ```

3. **Jobs Stuck in Queue**
   ```bash
   # Pause and resume queue
   POST /admin/queues/email/pause
   POST /admin/queues/email/resume
   ```

### Monitoring Commands
```bash
# Check Redis keys
redis-cli keys "*bull*"

# Monitor Redis operations
redis-cli monitor

# Check queue lengths
redis-cli llen bull:emailQueue:wait
redis-cli llen bull:emailQueue:active
```

## 🚀 Scaling

### Multiple Workers
```bash
# Start multiple email workers
npm run worker:email  # Worker 1
npm run worker:email  # Worker 2
npm run worker:email  # Worker 3
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
