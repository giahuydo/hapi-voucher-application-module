import { Agenda, Job } from 'agenda';
import mongoose from 'mongoose';
import databaseHealthCheckJob from '../../../agenda/jobs/databaseHealthCheck.job';

// Mock mongoose
jest.mock('mongoose', () => ({
  connection: {
    readyState: 1,
    db: {
      admin: jest.fn(() => ({
        ping: jest.fn().mockResolvedValue({ ok: 1 })
      }))
    }
  }
}));

describe('Database Health Check Job', () => {
  let mockAgenda: jest.Mocked<Agenda>;
  let mockJob: jest.Mocked<Job>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();

    // Mock Agenda
    mockAgenda = {
      define: jest.fn(),
      every: jest.fn().mockResolvedValue(undefined)
    } as any;

    // Mock Job
    mockJob = {
      attrs: { name: 'database-health-check' }
    } as any;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Job Registration', () => {
    it('should register the job with correct name', async () => {
      await databaseHealthCheckJob(mockAgenda);

      expect(mockAgenda.define).toHaveBeenCalledWith(
        'database-health-check',
        expect.any(Function)
      );
    });

    it('should schedule the job to run every minute', async () => {
      await databaseHealthCheckJob(mockAgenda);

      expect(mockAgenda.every).toHaveBeenCalledWith('1 minute', 'database-health-check');
    });
  });

  describe('Job Execution - Healthy Database', () => {
    it('should log success when database is healthy', async () => {
      await databaseHealthCheckJob(mockAgenda);

      // Get the job function that was registered
      const jobFunction = mockAgenda.define.mock.calls[0][1];
      
      // Execute the job
      await jobFunction(mockJob);

      expect(console.log).toHaveBeenCalledWith('🏥 Running database health check...');
      expect(console.log).toHaveBeenCalledWith('✅ Database connection is healthy');
      expect(console.log).toHaveBeenCalledWith('✅ Database ping successful');
      expect(console.log).toHaveBeenCalledWith('✅ Database health check completed');
    });
  });

  describe('Job Execution - Unhealthy Database', () => {
    it('should log error when database is disconnected', async () => {
      // Mock disconnected state
      (mongoose.connection.readyState as any) = 0;

      await databaseHealthCheckJob(mockAgenda);

      const jobFunction = mockAgenda.define.mock.calls[0][1];
      await jobFunction(mockJob);

      expect(console.error).toHaveBeenCalledWith('❌ Database connection is not healthy');
      expect(console.log).toHaveBeenCalledWith('Connection state: 0');
      expect(console.log).toHaveBeenCalledWith('Connection status: disconnected');
    });

    it('should log error when database is connecting', async () => {
      // Mock connecting state
      (mongoose.connection.readyState as any) = 2;

      await databaseHealthCheckJob(mockAgenda);

      const jobFunction = mockAgenda.define.mock.calls[0][1];
      await jobFunction(mockJob);

      expect(console.error).toHaveBeenCalledWith('❌ Database connection is not healthy');
      expect(console.log).toHaveBeenCalledWith('Connection status: connecting');
    });
  });

  describe('Job Execution - Database Ping Failure', () => {
    it('should log warning when ping fails', async () => {
      // Mock ping failure
      const mockPing = jest.fn().mockResolvedValue({ ok: 0 });
      (mongoose.connection.db.admin as any) = jest.fn(() => ({
        ping: mockPing
      }));

      await databaseHealthCheckJob(mockAgenda);

      const jobFunction = mockAgenda.define.mock.calls[0][1];
      await jobFunction(mockJob);

      expect(console.warn).toHaveBeenCalledWith('⚠️ Database ping failed');
    });
  });

  describe('Job Execution - Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // Mock an error during execution
      const mockPing = jest.fn().mockRejectedValue(new Error('Database error'));
      (mongoose.connection.db.admin as any) = jest.fn(() => ({
        ping: mockPing
      }));

      await databaseHealthCheckJob(mockAgenda);

      const jobFunction = mockAgenda.define.mock.calls[0][1];
      await jobFunction(mockJob);

      expect(console.error).toHaveBeenCalledWith('❌ Error during database health check:', expect.any(Error));
      expect(console.log).toHaveBeenCalledWith('✅ Database health check completed');
    });
  });

  describe('Connection State Mapping', () => {
    it('should correctly map all connection states', async () => {
      await databaseHealthCheckJob(mockAgenda);
      const jobFunction = mockAgenda.define.mock.calls[0][1];

      const states = [0, 1, 2, 3];
      const expectedStatuses = ['disconnected', 'connected', 'connecting', 'disconnecting'];

      for (let i = 0; i < states.length; i++) {
        (mongoose.connection.readyState as any) = states[i];
        jest.clearAllMocks();

        await jobFunction(mockJob);

        if (states[i] === 1) {
          expect(console.log).toHaveBeenCalledWith('✅ Database connection is healthy');
        } else {
          expect(console.error).toHaveBeenCalledWith('❌ Database connection is not healthy');
          expect(console.log).toHaveBeenCalledWith(`Connection status: ${expectedStatuses[i]}`);
        }
      }
    });
  });
});
