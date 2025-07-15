import request from 'supertest';
import Hapi from '@hapi/hapi';
import voucherRoutes from '../../../src/api/voucher/routes';
import Event from '../../../src/models/event.model';
import Voucher from '../../../src/models/voucher.model';
import { TEST_CONFIG } from '../../setup';

describe('Voucher API Integration Tests', () => {
  let server: Hapi.Server;

  beforeAll(async () => {
    server = Hapi.server({
      port: 0, // Use random port for testing
      host: 'localhost'
    });

    // Register routes
    server.route(voucherRoutes);
    
    console.log(`🧪 Running integration tests with ${TEST_CONFIG.USE_MOCK_DB ? 'mock' : 'real'} database`);
  });

  beforeEach(async () => {
    // Clear database before each test
    await Event.deleteMany({});
    await Voucher.deleteMany({});
  });

  describe('POST /events/{eventId}/vouchers', () => {
    it('should create voucher successfully', async () => {
      // Arrange
      const event = await Event.create({
        name: 'Test Event',
        maxQuantity: 10,
        issuedCount: 0
      });

      const payload = {
        userId: 'test-user-123'
      };

      // Act
      const response = await request(server.listener)
        .post(`/events/${event._id}/vouchers`)
        .send(payload)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('✅ Voucher issued successfully.');
      expect(response.body.data.code).toBeDefined();

      // Verify database state
      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.issuedCount).toBe(1);

      const voucher = await Voucher.findOne({ eventId: event._id });
      expect(voucher).toBeDefined();
      expect(voucher?.issuedTo).toBe('test-user-123');
      expect(voucher?.isUsed).toBe(false);
    });

    it('should return 456 when event is exhausted', async () => {
      // Arrange
      const event = await Event.create({
        name: 'Test Event',
        maxQuantity: 1,
        issuedCount: 1 // Already exhausted
      });

      const payload = {
        userId: 'test-user-123'
      };

      // Act & Assert
      const response = await request(server.listener)
        .post(`/events/${event._id}/vouchers`)
        .send(payload)
        .expect(456);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('🎟️ Voucher has been exhausted.');
    });

    it('should return 400 for invalid eventId', async () => {
      // Arrange
      const payload = {
        userId: 'test-user-123'
      };

      // Act & Assert
      await request(server.listener)
        .post('/events/invalid-id/vouchers')
        .send(payload)
        .expect(400);
    });

    it('should return 400 for missing userId in payload', async () => {
      // Arrange
      const event = await Event.create({
        name: 'Test Event',
        maxQuantity: 10,
        issuedCount: 0
      });

      const payload = {}; // Missing userId

      // Act & Assert
      await request(server.listener)
        .post(`/events/${event._id}/vouchers`)
        .send(payload)
        .expect(400);
    });

    it('should handle concurrent voucher requests', async () => {
      // Arrange
      const event = await Event.create({
        name: 'Test Event',
        maxQuantity: 2,
        issuedCount: 0
      });

      const payload1 = { userId: 'user1' };
      const payload2 = { userId: 'user2' };
      const payload3 = { userId: 'user3' };

      // Act - Make concurrent requests
      const [response1, response2, response3] = await Promise.all([
        request(server.listener)
          .post(`/events/${event._id}/vouchers`)
          .send(payload1),
        request(server.listener)
          .post(`/events/${event._id}/vouchers`)
          .send(payload2),
        request(server.listener)
          .post(`/events/${event._id}/vouchers`)
          .send(payload3)
      ]);

      // Assert
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(response3.status).toBe(456); // Third request should fail

      // Verify only 2 vouchers were issued
      const updatedEvent = await Event.findById(event._id);
      expect(updatedEvent?.issuedCount).toBe(2);

      const vouchers = await Voucher.find({ eventId: event._id });
      expect(vouchers).toHaveLength(2);
    });

    it('should validate ObjectId format', async () => {
      // Arrange
      const payload = {
        userId: 'test-user-123'
      };

      // Act & Assert - Test with invalid ObjectId format
      await request(server.listener)
        .post('/events/12345678901234567890123/vouchers') // Invalid ObjectId
        .send(payload)
        .expect(400);
    });
  });
}); 