import { ServerRoute } from '@hapi/hapi';
import * as Joi from 'joi';
import {
  issueVoucher,
  getAllVouchers,
  getVoucherById,
  useVoucher,
  releaseVoucher,
  deleteVoucher
} from './voucher.handler';
import {IdVoucherParamsSchema, getAllVouchersQuerySchema, issueVoucherPayloadSchema} from '../dto/voucher.input';
import { voucherSwaggerResponses } from './voucher.schemas';
import { sharedErrorSchemas, labeledResponseSchemas, swaggerResponses, createResponseSchema } from '../../../../utils/schemas';

const voucherRoutes: ServerRoute[] = [
  // 🎟️ Issue a new voucher
  {
    method: 'POST',
    path: '/vouchers/issue',
    options: {
      auth: 'jwt',
      tags: ['api', 'vouchers'],
      description: 'Issue a new voucher for a specific event',
      notes: 'Requires authentication. Event ID passed in request body. Returns 456 if event is full.',
      validate: {
        payload: issueVoucherPayloadSchema,
        failAction: (request, h, err) => {
          throw err;
        }
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: voucherSwaggerResponses.issueSuccess,
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            456: voucherSwaggerResponses.exhausted
          }
        }
      },
      handler: issueVoucher
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
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
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
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
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
            200: {
              description: 'Voucher marked as used',
              schema: labeledResponseSchemas.success('Voucher marked as used', 'UseVoucherResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
            },
            409: {
              description: 'Conflict - Resource already exists or in invalid state',
              schema: sharedErrorSchemas.conflict
            }
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
            200: {
              description: 'Voucher released successfully',
              schema: labeledResponseSchemas.success('Voucher released successfully', 'ReleaseVoucherResponse')
            },
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
            },
            409: {
              description: 'Voucher already released',
              schema: Joi.object({
                success: Joi.boolean().default(false),
                message: Joi.string().default('Voucher already released')
              }).label('VoucherAlreadyReleasedResponse')
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
            401: {
              description: 'Unauthorized - Invalid or missing token',
              schema: sharedErrorSchemas.unauthorized
            },
            404: {
              description: 'Resource not found',
              schema: sharedErrorSchemas.notFound
            },
            409: {
              description: 'Cannot delete used voucher',
              schema: Joi.object({
                success: Joi.boolean().default(false),
                message: Joi.string().default('Cannot delete a voucher that has been used')
              }).label('CannotDeleteUsedVoucherResponse')
            }
          }
        }
      }
    }
  }
];

export default voucherRoutes;
