export function transformResponse(data: any, message = 'Success') {
  return {
    success: true,
    data,
    message,
  };
} 