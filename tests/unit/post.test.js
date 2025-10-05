const request = require('supertest');
const express = require('express');
const { Fragment } = require('../../src/model/fragment');
const postHandler = require('../../src/routes/api/post');
const contentType = require('content-type');

jest.mock('../../src/model/fragment');

describe('POST /fragments', () => {
  const user = 'user1';
  let app;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    Fragment.isSupportedType = jest.fn((type) => type === 'text/plain');

    // Create a fresh app for each test
    app = express();

    // Mock authentication middleware
    app.use((req, res, next) => {
      if (req.headers.authorization === 'Basic dXNlcjE6cGFzcw==') {
        req.user = 'user1';
      }
      next();
    });

    // Raw body parser middleware
    app.use(
      express.raw({
        inflate: true,
        limit: '5mb',
        type: (req) => {
          const ct = req.headers['content-type'];
          if (!ct) return false;

          try {
            const { type } = contentType.parse(ct);
            return Fragment.isSupportedType(type);
          } catch {
            return false;
          }
        },
      })
    );

    // POST route
    app.post('/fragments', postHandler);
  });

  test('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/fragments')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello'));

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  test('creates a text/plain fragment', async () => {
    const mockSave = jest.fn();
    const mockSetData = jest.fn();

    Fragment.mockImplementation(() => ({
      id: 'abc123',
      ownerId: user,
      type: 'text/plain',
      size: 5,
      created: '2025-10-05T10:00:00Z',
      updated: '2025-10-05T10:00:00Z',
      save: mockSave,
      setData: mockSetData,
    }));

    const res = await request(app)
      .post('/fragments')
      .set('Authorization', 'Basic dXNlcjE6cGFzcw==')
      .set('Content-Type', 'text/plain')
      .send(Buffer.from('hello'));

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment.id).toBe('abc123');
    expect(res.body.fragment.ownerId).toBe(user);
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.header.location).toMatch(/\/fragments\/abc123/);

    expect(mockSave).toHaveBeenCalled();
    expect(mockSetData).toHaveBeenCalledWith(Buffer.from('hello'));
  });

  test('returns 415 for unsupported content type', async () => {
    Fragment.isSupportedType = jest.fn(() => false);

    const res = await request(app)
      .post('/fragments')
      .set('Authorization', 'Basic dXNlcjE6cGFzcw==')
      .set('Content-Type', 'application/xml')
      .send(Buffer.from('<xml/>'));

    expect(res.status).toBe(415);
    expect(res.body.error).toBe('Unsupported content type: application/xml');
  });

  test('returns 400 for invalid Content-Type header', async () => {
    const res = await request(app)
      .post('/fragments')
      .set('Authorization', 'Basic dXNlcjE6cGFzcw==')
      .set('Content-Type', '???')
      .send(Buffer.from('oops'));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid Content-Type');
  });
});
