import Joi from 'joi';

/**
 * Input type for creating an event
 */
export interface CreateEventInput {
  name: string;
  maxQuantity: number;
}

export const createEventSchema = Joi.object<CreateEventInput>({
  name: Joi.string().min(2).required().description('Event name'),
  maxQuantity: Joi.number().min(1).required().description('Maximum number of vouchers'),
});

/**
 * Input type for updating an event
 */
export interface UpdateEventInput {
  name?: string;
  maxQuantity?: number;
}

export const updateEventSchema = Joi.object<UpdateEventInput>({
  name: Joi.string().min(2).optional().description('Event name'),
  maxQuantity: Joi.number().min(1).optional().description('Maximum number of vouchers'),
});

/**
 * Input for validating route params with { id }
 */
export interface EventIdParam {
  id: string;
}

export const eventIdParamSchema = Joi.object<EventIdParam>({
  id: Joi.string().length(24).required().description('MongoDB ObjectId of the event'),
});

/**
 * Input for validating params with { eventId }
 */
export interface EventLockParam {
  eventId: string;
}

export const eventIdLockParamSchema = Joi.object<EventLockParam>({
  eventId: Joi.string().length(24).required().description('Event ID for edit lock'),
});
