import { Agenda, Job } from 'agenda';
import {Event} from '../../src/modules/event/event.model';

export default async function unlockVoucherLocksJob(agenda: Agenda): Promise<void> {
  agenda.define('auto-unlock-edit-events', async (job: Job) => {
    console.log('🔓 Running auto-unlock job...');

    try {
      const now = new Date();

      const result = await Event.updateMany(
        {
          editingBy: { $ne: null },
          editLockAt: { $lt: now },
        },
        {
          $set: {
            editingBy: null,
            editLockAt: null,
          },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(`✅ Unlocked ${result.modifiedCount} event(s) at ${now.toISOString()}`);
      } else {
        console.log('ℹ️ No expired edit locks found');
      }
    } catch (err) {
      console.error('❌ Error during unlock job:', err);
    }

    console.log('✅ Auto-unlock job completed successfully');
  });

  await agenda.every('1 minute', 'auto-unlock-edit-events');
  console.log('✅ Job "auto-unlock-edit-events" scheduled every 10 seconds');
}