// tests/unit/getById.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id', () => {
  
  // Test 1: Successfully get fragment data
  test('authenticated user can get their fragment data by id', async () => {
    const content = 'This is a test fragment';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(content);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(content);
    expect(res.headers['content-type']).toContain('text/plain');
  });

  // Test 2: Returns correct Content-Type header
  test('returns correct Content-Type header for different fragment types', async () => {
    // Test text/plain
    const plainRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Plain text');
    
    expect(plainRes.statusCode).toBe(201);
    const plainId = plainRes.body.fragment.id;
    
    const getPlain = await request(app)
      .get(`/v1/fragments/${plainId}`)
      .auth('user1@email.com', 'password1');
    
    expect(getPlain.statusCode).toBe(200);
    expect(getPlain.headers['content-type']).toContain('text/plain');
    expect(getPlain.text).toBe('Plain text');

    // Test text/html (only if supported)
    const htmlRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<h1>HTML</h1>');
    
    // Only test if HTML is supported
    if (htmlRes.statusCode === 201) {
      const htmlId = htmlRes.body.fragment.id;
      
      const getHtml = await request(app)
        .get(`/v1/fragments/${htmlId}`)
        .auth('user1@email.com', 'password1');
      
      expect(getHtml.statusCode).toBe(200);
      expect(getHtml.headers['content-type']).toContain('text/html');
      expect(getHtml.text).toBe('<h1>HTML</h1>');
    }
  });

  // Test 3: Returns 404 for non-existent fragment
  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id-12345')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  // Test 4: Returns 404 when accessing another user's fragment
  test('cannot get another user\'s fragment data', async () => {
    // User 1 creates a fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User 1 private data');
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    // User 2 tries to access it
    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(404);
  });

  // Test 5: Returns 401 for unauthenticated requests
  test('unauthenticated requests are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments/some-id');

    expect(res.statusCode).toBe(401);
  });

  // Test 6: Returns exact data without modification
  test('returns exact fragment data without modification', async () => {
    const content = 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(content);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(content);
  });

  // Test 7: Handles multiline text correctly
  test('handles multiline text correctly', async () => {
    const content = `Line 1
Line 2
Line 3`;
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(content);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(content);
  });

  // Test 8: Returns data for text/markdown (if supported)
  test('returns raw markdown data (not converted)', async () => {
    const markdown = '# Heading\n\n**Bold text**';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);
    
    // Only test if markdown is supported
    if (postRes.statusCode === 201) {
      const fragmentId = postRes.body.fragment.id;

      const res = await request(app)
        .get(`/v1/fragments/${fragmentId}`)
        .auth('user1@email.com', 'password1');

      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/markdown');
      expect(res.text).toBe(markdown);
    } else {
      // Skip test if markdown not supported yet
      expect(postRes.statusCode).toBe(415);
    }
  });

  // Test 9: Returns empty fragment correctly
  test('handles empty fragment data', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('');
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe('');
  });

  // Test 10: Large content handling
  test('handles large content correctly', async () => {
    const largeContent = 'A'.repeat(10000);
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(largeContent);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toBe(largeContent);
    expect(res.text.length).toBe(10000);
  });

  // Test 11: Content-Length header is set correctly
  test('sets Content-Length header correctly', async () => {
    const content = 'Test content';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(content);
    
    expect(postRes.statusCode).toBe(201);
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-length']).toBeDefined();
  });

  // Test 12: Invalid fragment ID format
  test('returns 404 for invalid fragment ID format', async () => {
    const res = await request(app)
      .get('/v1/fragments/invalid-format-xyz')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });
});
