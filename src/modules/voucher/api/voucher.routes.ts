import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import {
  requestVoucher,
  getAllVouchers,
  getVoucherById,
  useVoucher
} from './voucher.handler';
import {
  issueVoucherSchema,
  getVoucherByIdParamsSchema,
  markVoucherUsedParamsSchema,
  IdParamSchema
} from '../dto/voucher.input';

const voucherRoutes: ServerRoute[] = [
  // 🎟️ Issue a new voucher
  {
    method: 'POST',
    path: '/events/{eventId}/vouchers',
    options: {
      tags: ['api', 'vouchers'],
      description: 'Issue a new voucher for a specific event',
      notes: 'Requires userId in payload. Returns 456 if event is full.',
      validate: {
        params: IdParamSchema,
        payload: issueVoucherSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Voucher issued successfully',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  code: Joi.string()
                })
              })
            },
            456: {
              description: 'Voucher exhausted'
            }
          }
        }
      },
      handler: requestVoucher
    }
  },

  // 📋 Get all vouchers
  {
    method: 'GET',
    path: '/vouchers',
    options: {
      tags: ['api', 'vouchers'],
      description: 'Get all vouchers',
      handler: getAllVouchers,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'List of all vouchers',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.array().items(Joi.object({
                  id: Joi.string(),
                  eventId: Joi.string(),
                  issuedTo: Joi.string(),
                  code: Joi.string(),
                  isUsed: Joi.boolean(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                }))
              })
            }
          }
        }
      }
    }
  },

  // 🔍 Get a voucher by ID
  {
    method: 'GET',
    path: '/vouchers/{id}',
    options: {
      tags: ['api', 'vouchers'],
      description: 'Get a voucher by ID',
      validate: {
        params: getVoucherByIdParamsSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: getVoucherById,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Voucher details',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string(),
                data: Joi.object({
                  id: Joi.string(),
                  eventId: Joi.string(),
                  issuedTo: Joi.string(),
                  code: Joi.string(),
                  isUsed: Joi.boolean(),
                  createdAt: Joi.date(),
                  updatedAt: Joi.date()
                })
              })
            },
            404: {
              description: 'Voucher not found'
            }
          }
        }
      }
    }
  },

  // ✅ Mark voucher as used
  {
    method: 'PATCH',
    path: '/vouchers/{id}/use',
    options: {
      tags: ['api', 'vouchers'],
      description: 'Mark a voucher as used',
      validate: {
        params: markVoucherUsedParamsSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: useVoucher,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Voucher marked as used' },
            404: { description: 'Voucher not found' },
            409: { description: 'Voucher already used' }
          }
        }
      }
    }
  }
  
];

export default voucherRoutes;
