jest.mock('../../../src/lib/mailer', () => ({ sendMail: jest.fn() }));

import { sendMail } from '../../../src/lib/mailer';
import {
  sendActivationEmail,
  sendPasswordResetEmail,
} from '../../../src/services/emailService';

const mockSendMail = sendMail as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  mockSendMail.mockResolvedValue(undefined);
  process.env.FRONTEND_URL = 'http://localhost:3000';
});

describe('sendActivationEmail', () => {
  it('builds the activation URL and sends the rendered email', async () => {
    await sendActivationEmail('a@b.com', '12345', 15);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('a@b.com');
    expect(call.subject).toContain('12345');
    expect(call.html).toContain(
      'href="http://localhost:3000/register/activate?email&#x3D;a%40b.com&amp;code&#x3D;12345"'
    );
    expect(call.text).toContain(
      'http://localhost:3000/register/activate?email=a%40b.com&code=12345'
    );
  });
});

describe('sendPasswordResetEmail', () => {
  it('builds the reset URL and sends the rendered email', async () => {
    await sendPasswordResetEmail('a@b.com', 'tok123', 15);

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe('a@b.com');
    expect(call.html).toContain(
      'href="http://localhost:3000/reset-password?token&#x3D;tok123&amp;email&#x3D;a%40b.com"'
    );
    expect(call.text).toContain(
      'http://localhost:3000/reset-password?token=tok123&email=a%40b.com'
    );
  });
});
