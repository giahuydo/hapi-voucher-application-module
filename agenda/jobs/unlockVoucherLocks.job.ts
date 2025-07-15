import { Agenda } from 'agenda';
import Event from '../../src/models/event.model';

export default function unlockVoucherLocksJob(agenda: Agenda): void {
  agenda.define('auto-unlock-edit-events', async () => {
    try {
      console.log('🔓 Running auto-unlock job...');
      
      // For now, just log that the job is running
      // This can be expanded when we add editingBy and editLockAt fields to Event model
      console.log('✅ Auto-unlock job completed successfully');
    } catch (error) {
      console.error('❌ Auto-unlock job failed:', error);
    }
  });

  // Schedule job to run every minute
  agenda.every('1 minute', 'auto-unlock-edit-events');
}
