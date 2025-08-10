# Agenda Jobs System

## 📁 File Structure

```
agenda/
├── agenda.instance.ts           # Agenda instance configuration
├── jobs/
│   ├── unlockVoucherLocks.job.ts    # Auto-unlock expired edit locks
│   ├── databaseHealthCheck.job.ts   # Database connection health check
│   └── README.md                    # This documentation
└── README.md                         # This file
```

## 🎯 Available Jobs

### **1. Auto-Unlock Edit Locks (`unlockVoucherLocks.job.ts`)**

**Purpose**: Automatically release edit locks on events that have expired

**Schedule**: Every 1 minute

**Functionality**:
- Finds events with expired edit locks (`editLockAt < now`)
- Sets `editingBy` to `null` and `editLockAt` to `null`
- Logs the number of unlocked events

**Use Case**: Prevents events from being permanently locked if a user's session expires

### **2. Database Health Check (`databaseHealthCheck.job.ts`)**

**Purpose**: Monitor database connection stability

**Schedule**: Every 1 minute

**Functionality**:
- Checks Mongoose connection state
- Performs database ping to verify connection is truly stable
- Logs connection status and any issues
- Provides debugging information for connection states

**Use Case**: Early detection of database connectivity issues

## 🔧 Job Configuration

### **Agenda Instance Settings**:
```typescript
const agenda = new Agenda({
  db: {
    address: process.env.MONGO_URI,
    collection: "agendaJobs",
  },
  processEvery: "10 seconds",      // Check for jobs every 10 seconds
  defaultConcurrency: 1,           // Process 1 job at a time
  maxConcurrency: 5,               // Maximum 5 concurrent jobs
});
```

### **Job Scheduling**:
```typescript
// Schedule job to run every minute
await agenda.every('1 minute', 'job-name');

// Other scheduling options:
await agenda.every('30 seconds', 'job-name');
await agenda.every('1 hour', 'job-name');
await agenda.every('1 day', 'job-name');
```

## 📊 Job Monitoring

### **Event Hooks**:
```typescript
agenda.on('start', (job) => {
  console.log(`🔄 Job "${job.attrs.name}" started`);
});

agenda.on('complete', (job) => {
  console.log(`✅ Job "${job.attrs.name}" completed`);
});

agenda.on('fail', (error, job) => {
  console.error(`❌ Job "${job.attrs.name}" failed:`, error);
});
```

### **Job Status**:
- **start**: Job execution begins
- **complete**: Job finished successfully
- **fail**: Job encountered an error

## 🚀 Adding New Jobs

### **1. Create Job File**:
```typescript
// agenda/jobs/newJob.job.ts
import { Agenda, Job } from 'agenda';

export default async function newJob(agenda: Agenda): Promise<void> {
  agenda.define('new-job-name', async (job: Job) => {
    console.log('🔄 Running new job...');
    
    try {
      // Job logic here
      console.log('✅ Job completed successfully');
    } catch (err) {
      console.error('❌ Job failed:', err);
    }
  });

  // Schedule the job
  await agenda.every('5 minutes', 'new-job-name');
  console.log('✅ Job "new-job-name" scheduled every 5 minutes');
}
```

### **2. Register in Plugin**:
```typescript
// src/plugins/agenda.plugin.ts
import newJob from "../../agenda/jobs/newJob.job";

// In register function:
await newJob(agenda);
```

## 🔍 Job Debugging

### **Check Job Definitions**:
```typescript
console.log("✅ Jobs registered:", Object.keys(agenda._definitions));
```

### **Manual Job Execution**:
```typescript
// Run job immediately (for testing)
await agenda.now('job-name');

// Run job with data
await agenda.now('job-name', { customData: 'value' });
```

### **Job History**:
Jobs are stored in MongoDB collection `agendaJobs` with:
- Job name and schedule
- Execution history
- Success/failure status
- Error logs

## ⚠️ Best Practices

### **1. Error Handling**:
```typescript
try {
  // Job logic
} catch (err) {
  console.error('❌ Job failed:', err);
  // Don't re-throw - let Agenda handle it
}
```

### **2. Logging**:
```typescript
console.log('🔄 Job started');
console.log('✅ Job completed');
console.log('❌ Job failed:', err);
```

### **3. Resource Cleanup**:
```typescript
// Clean up resources in finally block
finally {
  // Close connections, clear timeouts, etc.
}
```

### **4. Graceful Shutdown**:
```typescript
server.events.on("stop", async () => {
  console.log("🛑 Stopping Agenda...");
  await agenda.stop();
  console.log("✅ Agenda stopped");
});
```

## 📈 Monitoring & Alerts

### **Health Check Endpoint**:
Consider adding a health check endpoint that shows:
- Job execution status
- Last run times
- Error counts
- Database connection status

### **Log Aggregation**:
- Use structured logging for better monitoring
- Consider integrating with monitoring tools
- Set up alerts for job failures

## 🔄 Job Lifecycle

1. **Scheduled**: Job is queued for execution
2. **Queued**: Job waits for available worker
3. **Running**: Job executes
4. **Completed/Failed**: Job finishes with result
5. **Next Run**: Job is rescheduled based on interval

Jobs run continuously as long as the server is running and Agenda is started! 🚀
