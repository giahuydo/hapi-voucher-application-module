export const generateVoucherCode = (): string => {
    return `VC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  };