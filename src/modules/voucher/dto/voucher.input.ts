import Joi from 'joi';
import { createInputSchemas, generateSearchSchema } from '../../../../utils/schemas';

export interface IssueVoucherInput {
  eventId: string;
  userId: string;
}

/**
 * Input used for issuing a voucher.
 * Used in: POST /api/vouchers/issue
 */
export const IdVoucherParamsSchema = createInputSchemas.params.id('id');

export const eventIdParamSchema = createInputSchemas.params.eventId;

/**
 * Query parameters for getting all vouchers
 * Used in: GET /api/vouchers
 */
export const getAllVouchersQuerySchema = createInputSchemas.query.voucherSearch;

/**
 * Payload schema for issuing a voucher
 * Used in: POST /api/vouchers/issue
 */
export const issueVoucherPayloadSchema = Joi.object({
  eventId: Joi.string().required().description('Event ID to issue voucher for')
});
