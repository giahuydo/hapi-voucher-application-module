import Joi from 'joi';

/**
 * Input used for issuing a voucher.
 * Used in: POST /api/vouchers/issue
 */
export interface IssueVoucherInput {
  userId: string;
  eventId: string; 
}

export const issueVoucherSchema = Joi.object<{userId: string}>({
  userId: Joi.string().length(24).required().description('User MongoDB ObjectId'),
});

/**
 * Input for marking voucher as used.
 * Used in: PATCH /api/vouchers/{id}/mark-used
 */
export interface MarkVoucherUsedParams {
  id: string;
}

export const markVoucherUsedParamsSchema = Joi.object<MarkVoucherUsedParams>({
  id: Joi.string().length(24).required().description('Voucher MongoDB ObjectId'),
});

/**
 * Input for getting a voucher by ID.
 * Used in: GET /api/vouchers/{id}
 */
export interface GetVoucherByIdParams {
  id: string;
}

export const getVoucherByIdParamsSchema = Joi.object<GetVoucherByIdParams>({
  id: Joi.string().length(24).required().description('Voucher MongoDB ObjectId'),
});

/**
 * Input for getting vouchers by event ID.
 * Used in: GET /api/vouchers/by-event/{eventId}
 */
export interface GetVouchersByEventParams {
  eventId: string;
}

export const getVouchersByEventParamsSchema = Joi.object<GetVouchersByEventParams>({
  eventId: Joi.string().length(24).required().description('Event MongoDB ObjectId'),
});


export const IdParamSchema = Joi.object<{ eventId: string }>({
  eventId: Joi.string().length(24).required().description('MongoDB ObjectId of the event'),
});

