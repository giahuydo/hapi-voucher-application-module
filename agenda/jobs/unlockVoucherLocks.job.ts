import { Agenda, Job } from 'agenda';

export default async function unlockVoucherLocksJob(agenda: Agenda): Promise<void> {
  agenda.define('auto-unlock-edit-events', async (job: Job) => {
    console.log('🔓 Running auto-unlock job...');
  });

  await agenda.every('10 seconds', 'auto-unlock-edit-events');
  console.log('✅ Job auto-unlock-edit-events scheduled every 10 seconds');
}