# Hapi Voucher Application Module

## Purpose
- Manage voucher issuance per event, ensuring the maximum quantity is never exceeded.
- Use MongoDB transactions for data consistency and safety.
- Demonstrate transaction handling, locking, and concurrent request safety in a real-world scenario.

## Test Structure
- **Unit tests:** Validate individual function logic, mocking all DB and external services.
- **Integration tests:** (if present) Validate real flows between modules.

## Key Voucher Tests
- **Successful voucher issuance:** When quantity remains, a user receives a new voucher code.
- **Out of stock:** If all vouchers are issued, respond with error 456.
- **Transaction retry:** On transient transaction errors (e.g., collisions), the service automatically retries.
- **Concurrent requests:** When multiple users request vouchers simultaneously, only one receives a voucher; others get error 456 (no over-issuing).

## How to Run Tests

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run all tests:**
   ```bash
   npx jest
   ```
   Or run a specific test file:
   ```bash
   npx jest tests/unit/voucher/voucher.service.test.ts
   ```

3. **View results:**
   - Results are shown in the terminal.
   - For detailed output, use:
     ```bash
     npx jest --verbose
     ```

## Test Notes
- **eventId** must be a valid ObjectId (24 hex characters), e.g., `'507f1f77bcf86cd799439011'`.
- All tests mock the database; no real MongoDB connection is required.
- When adding new tests, ensure you mock `.session()` methods if using transactions.

## References
- [MongoDB Transaction & Retry Pattern](https://docs.mongodb.com/v4.0/core/transactions/#retry-commit-operation)
- [Jest Documentation](https://jestjs.io/) 
