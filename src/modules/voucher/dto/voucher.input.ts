import Joi from 'joi';

export interface IssueVoucherInput {
  eventId: string;
  userId: string;
}

/**
 * Input used for issuing a voucher.
 * Used in: POST /api/vouchers/issue
 */
export const IdVoucherParamsSchema = Joi.object<{ id: string }>({
  id: Joi.string()
    .length(24)
    .required()
    .description("Voucher MongoDB ObjectId"),
});

export const eventIdParamSchema = Joi.object<{ eventId: string }>({
  eventId: Joi.string().length(24).required().description('MongoDB ObjectId of the event'),
});

