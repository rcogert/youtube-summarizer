// summarize.test.ts

import handler from './summarize';

// Mock the libraries using a factory function. This is the most reliable way.
jest.mock('youtube-transcript-api', () => ({
  __esModule: true, // This is important for ES Modules
  getTranscript: jest.fn(),
}));
jest.mock('openai', () => {
  const mockCreate = jest.fn();
  return {
    __esModule: true,
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: { completions: { create: mockCreate } },
    })),
    // We export the mockCreate function so we can access it in our tests
    mockCreateCompletion: mockCreate,
  };
});

// Now, import the mocked functions so we can control them
import { getTranscript } from 'youtube-transcript-api';
import { OpenAI, mockCreateCompletion } from 'openai';

// Create a typed mock that we can control
const mockedGetTranscript = getTranscript as jest.Mock;

const mockResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('summarize API handler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return a 400 error if videoId is missing', async () => {
    const req = { method: 'POST', body: {} };
    const res = mockResponse();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing or invalid videoId' });
  });

  test('should return a 404 error if transcript is not found', async () => {
    const req = { method: 'POST', body: { videoId: 'video-with-no-transcript' } };
    const res = mockResponse();
    mockedGetTranscript.mockRejectedValue(new Error('No transcript found'));

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'No transcript available for this video.' });
  });

  test('should return 200 with a summary on a successful request', async () => {
    const req = { method: 'POST', body: { videoId: 'valid-video-id' } };
    const res = mockResponse();
    const fakeTranscript = [{ text: 'This is a test.', start: 1.0, duration: 2.0 }];
    const fakeSummary = '• This is a summary. [1]';

    mockedGetTranscript.mockResolvedValue(fakeTranscript);
    // Note we are using the exported mockCreateCompletion function here
    mockCreateCompletion.mockResolvedValue({
      choices: [{ message: { content: fakeSummary } }],
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ summary: fakeSummary });
    expect(mockCreateCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gpt-4.1-mini',
      })
    );
  });
});
