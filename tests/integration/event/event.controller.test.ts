import { server } from '../../../server'; 

describe('Event API', () => {
  it('GET /events should return 200 and list of events', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/events'
    });
    expect(res.statusCode).toBe(200);
    expect(res.result).toHaveProperty('success', true);
    expect(res.result).toHaveProperty('data');
  });
});