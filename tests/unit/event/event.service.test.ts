import * as EventService from '../../../src/modules/event/event.service';
import { Event } from '../../../src/modules/event/event.model';

jest.mock('../../../src/modules/event/event.model');

describe('EventService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('getAllEvents should return all events', async () => {
    (Event.find as jest.Mock).mockResolvedValue([{ name: 'Test Event' }]);
    const events = await EventService.getAllEvents();
    expect(events).toEqual([{ name: 'Test Event' }]);
    expect(Event.find).toHaveBeenCalled();
  });

  it('getEventById should return event by id', async () => {
    (Event.findById as jest.Mock).mockResolvedValue({ name: 'Event 1' });
    const event = await EventService.getEventById('123');
    expect(event).toEqual({ name: 'Event 1' });
    expect(Event.findById).toHaveBeenCalledWith('123');
  });
});