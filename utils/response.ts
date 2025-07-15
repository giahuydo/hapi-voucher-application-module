export function transformResponse(data: any, message = 'Thành công') {
  return {
    success: true,
    data,
    message,
  };
} 