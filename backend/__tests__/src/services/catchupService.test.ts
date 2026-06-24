// catchupService has module-level state (lastRun Map), so each test reloads the module fresh.
// jest.doMock + jest.resetModules() is used instead of top-level jest.mock().

const USER_ID = 'user-1';

describe('runCatchupThrottled', () => {
  let runCatchupThrottled: (userId: string) => Promise<void>;
  let mockMaterialize: jest.Mock;
  let nowSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.doMock('../../../src/services/recurrenceEngine', () => ({
      materializeDueTransactions: jest.fn().mockResolvedValue({ created: 0 }),
    }));

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('../../../src/services/catchupService');
    runCatchupThrottled = mod.runCatchupThrottled;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mockMaterialize =
      require('../../../src/services/recurrenceEngine').materializeDueTransactions;

    nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
  });

  afterEach(() => {
    nowSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('calls materializeDueTransactions on the first invocation', async () => {
    await runCatchupThrottled(USER_ID);

    expect(mockMaterialize).toHaveBeenCalledWith(USER_ID);
    expect(mockMaterialize).toHaveBeenCalledTimes(1);
  });

  it('does not call materializeDueTransactions within the 60-second throttle window', async () => {
    await runCatchupThrottled(USER_ID);
    // Still within throttle window (same timestamp)
    await runCatchupThrottled(USER_ID);

    expect(mockMaterialize).toHaveBeenCalledTimes(1);
  });

  it('calls materializeDueTransactions again after 60 seconds have elapsed', async () => {
    await runCatchupThrottled(USER_ID);

    // Advance time by 61 seconds
    nowSpy.mockReturnValue(1_000_000 + 61_000);
    await runCatchupThrottled(USER_ID);

    expect(mockMaterialize).toHaveBeenCalledTimes(2);
  });

  it('does not throw when materializeDueTransactions rejects', async () => {
    mockMaterialize.mockRejectedValueOnce(new Error('DB error'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await expect(runCatchupThrottled(USER_ID)).resolves.toBeUndefined();

    consoleSpy.mockRestore();
  });

  it('logs the error when materializeDueTransactions rejects', async () => {
    mockMaterialize.mockRejectedValueOnce(new Error('DB error'));
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    await runCatchupThrottled(USER_ID);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
