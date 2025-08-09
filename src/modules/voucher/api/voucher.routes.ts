import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import {
  requestVoucher,
  getAllVouchers,
  getVoucherById,
  useVoucher,
  releaseVoucher,
  deleteVoucher
} from './voucher.handler';
import {IdVoucherParamsSchema, eventIdParamSchema, getAllVouchersQuerySchema} from '../dto/voucher.input';
import { voucherSwaggerResponses } from './voucher.schemas';
import { swaggerResponses } from '../../../../utils/schemas';

const voucherRoutes: ServerRoute[] = [
  // 🎟️ Issue a new voucher
  {
    method: 'POST',
    path: '/events/{eventId}/vouchers',
    options: {
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Issue a new voucher for a specific event',
      notes: 'Requires authentication. Returns 456 if event is full.',
      validate: {
        params: eventIdParamSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: voucherSwaggerResponses.issueSuccess,
            401: swaggerResponses.common[401],
            456: voucherSwaggerResponses.exhausted
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
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Get all vouchers with optional filtering and pagination',
      notes: 'Requires authentication. Supports pagination, filtering by eventId, issuedTo, isUsed, and search by code. Demonstrates collection linking by populating event information.',
      validate: {
        query: getAllVouchersQuerySchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: getAllVouchers,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: voucherSwaggerResponses.listSuccess,
            401: swaggerResponses.common[401]
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
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Get a voucher by ID',
      notes: 'Returns voucher details with populated event information. Demonstrates collection linking between Voucher and Event collections.',
      validate: {
        params: IdVoucherParamsSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: getVoucherById,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: voucherSwaggerResponses.singleSuccess,
            401: swaggerResponses.common[401],
            404: swaggerResponses.common[404]
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
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Mark a voucher as used',
      validate: {
        params: IdVoucherParamsSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: useVoucher,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Voucher marked as used' },
            401: swaggerResponses.common[401],
            404: swaggerResponses.common[404],
            409: swaggerResponses.common[409]
          }
        }
      }
    }
  },

  // ✅ Release voucher as used
  {
    method: 'PATCH',
    path: '/vouchers/{id}/release',
    options: {
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Release a voucher (mark as unused)',
      validate: {
        params: IdVoucherParamsSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: releaseVoucher,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Voucher released successfully' },
            401: swaggerResponses.common[401],
            404: swaggerResponses.common[404],
            409: { 
              description: 'Voucher already released',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string().default('Voucher already released')
              })
            }
          }
        }
      }
    }
  },

  // 🗑️ Delete voucher
  {
    method: 'DELETE',
    path: '/vouchers/{id}',
    options: {
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Delete a voucher by ID',
      notes: 'Requires authentication. Cannot delete vouchers that have been used.',
      validate: {
        params: IdVoucherParamsSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      handler: deleteVoucher,
      plugins: {
        'hapi-swagger': {
          responses: {
            200: voucherSwaggerResponses.deleteSuccess,
            401: swaggerResponses.common[401],
            404: swaggerResponses.common[404],
            409: { 
              description: 'Cannot delete used voucher',
              schema: Joi.object({
                success: Joi.boolean(),
                message: Joi.string().default('Cannot delete a voucher that has been used')
              })
            }
          }
        }
      }
    }
  }
];

export default voucherRoutes;
