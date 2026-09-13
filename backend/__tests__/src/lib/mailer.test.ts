describe('mailer', () => {
  const ORIGINAL_ENV = process.env;
  let createTransportMock: jest.Mock;
  let sendMailMock: jest.Mock;
  let mailer: typeof import('../../../src/lib/mailer');
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_PORT;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;
    delete process.env.MAIL_FROM;

    sendMailMock = jest.fn().mockResolvedValue(undefined);
    createTransportMock = jest.fn().mockReturnValue({ sendMail: sendMailMock });
    jest.doMock('nodemailer', () => ({ createTransport: createTransportMock }));

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mailer = require('../../../src/lib/mailer');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = ORIGINAL_ENV;
  });

  const MSG = {
    to: 'user@example.com',
    subject: 'Hello',
    html: '<p>hi</p>',
    text: 'hi',
  };

  it('logs to the console with a [DEV] prefix when SMTP_HOST is unset', async () => {
    await mailer.sendMail(MSG);

    expect(createTransportMock).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const logged = consoleLogSpy.mock.calls[0][0] as string;
    expect(logged).toContain('[DEV]');
    expect(logged).toContain(MSG.to);
    expect(logged).toContain(MSG.subject);
    expect(logged).toContain(MSG.text);
  });

  it('sends via the SMTP transport when configured, with secure:true on port 465', async () => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.SMTP_PORT = '465';
    process.env.SMTP_USER = 'resend';
    process.env.SMTP_PASS = 'api-key';
    process.env.MAIL_FROM = 'Budget Tracker <onboarding@resend.dev>';

    await mailer.sendMail(MSG);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: 'api-key' },
      })
    );
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'Budget Tracker <onboarding@resend.dev>',
      ...MSG,
    });
    expect(consoleLogSpy).not.toHaveBeenCalled();
  });

  it('uses secure:false on port 587', async () => {
    process.env.SMTP_HOST = 'smtp-relay.brevo.com';
    process.env.SMTP_PORT = '587';
    process.env.MAIL_FROM = 'noreply@example.com';

    await mailer.sendMail(MSG);

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false })
    );
  });

  it('memoizes the transporter across multiple sends', async () => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.MAIL_FROM = 'noreply@example.com';

    await mailer.sendMail(MSG);
    await mailer.sendMail(MSG);

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });

  it('rejects when SMTP_HOST is set but MAIL_FROM is missing', async () => {
    process.env.SMTP_HOST = 'smtp.resend.com';

    await expect(mailer.sendMail(MSG)).rejects.toThrow(/MAIL_FROM/);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('propagates a rejection from the transport', async () => {
    process.env.SMTP_HOST = 'smtp.resend.com';
    process.env.MAIL_FROM = 'noreply@example.com';
    sendMailMock.mockRejectedValue(new Error('connection refused'));

    await expect(mailer.sendMail(MSG)).rejects.toThrow('connection refused');
  });
});
