// tests/unit/getInfo.test.js

const request = require('supertest');
const app = require('../../src/app');
describe('GET /v1/fragments/:id/info', () => {
  
  // Test 1: Successfully get fragment metadata
  test('authenticated user can get fragment metadata by id', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('This is a test fragment');
    
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.fragment).toBeDefined();
  });

  // Test 2: Response has correct metadata structure
  test('returns correct metadata structure', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Test content');
    
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    // Check all required fields exist
    expect(res.body.fragment).toHaveProperty('id');
    expect(res.body.fragment).toHaveProperty('ownerId');
    expect(res.body.fragment).toHaveProperty('created');
    expect(res.body.fragment).toHaveProperty('updated');
    expect(res.body.fragment).toHaveProperty('type');
    expect(res.body.fragment).toHaveProperty('size');
    
    // Verify values are correct
    expect(res.body.fragment.id).toBe(fragmentId);
    
    // Verify ownerId is a valid SHA256 hash
    expect(res.body.fragment.ownerId).toMatch(/^[a-f0-9]{64}$/);
    
    expect(res.body.fragment.type).toBe('text/plain');
    expect(res.body.fragment.size).toBe(12);
  });

  // Test 3: Returns 404 for non-existent fragment
  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent-id/info')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
    expect(res.body.status).toBe('error');
  });

  // Test 4: Returns 404 when accessing another user's fragment
  test('cannot get another user\'s fragment metadata', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('User 1 fragment');
    
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(404);
  });

  // Test 5: Returns 401 for unauthenticated requests
  test('unauthenticated requests are denied', async () => {
    const res = await request(app)
      .get('/v1/fragments/some-id/info');

    expect(res.statusCode).toBe(401);
  });


  // Test 6: Size is calculated correctly
  test('size field reflects actual content size', async () => {
    const content = 'This is exactly 25 chars';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(content);
    
    const fragmentId = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${fragmentId}/info`)
      .auth('user1@email.com', 'password1');

    expect(res.body.fragment.size).toBe(content.length);
  });
});
