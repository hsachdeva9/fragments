// tests/unit/getByIdEst.test.js

const request = require('supertest');
const app = require('../../src/app');

describe('GET /v1/fragments/:id.ext (conversions)', () => {
  
  // Test 1: Convert markdown to HTML
  test('converts markdown fragment to HTML', async () => {
    const markdown = '# Heading\n\nThis is **bold** text.';
    
    // Create markdown fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);
    
    expect(postRes.statusCode).toBe(201);
    const id = postRes.body.fragment.id;

    // Request as HTML
    const res = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('<h1>Heading</h1>');
    expect(res.text).toContain('<strong>bold</strong>');
  });

  // Test 2: Get markdown as markdown (no conversion)
  test('returns markdown fragment as markdown without conversion', async () => {
    const markdown = '# Test';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);
    
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.md`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/markdown');
    expect(res.text).toBe(markdown);
  });

  // Test 3: Convert markdown to plain text
  test('converts markdown to plain text', async () => {
    const markdown = '# Heading\n\n**Bold**';
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);
    
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.txt`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
  });

  // Test 4: Unsupported conversion returns 415
  test('returns 415 for unsupported conversion', async () => {
    // Create plain text fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Plain text');
    
    const id = postRes.body.fragment.id;

    // Try to convert plain text to HTML (not supported)
    const res = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
    expect(res.body.status).toBe('error');
  });

  // Test 5: Invalid extension returns 415
  test('returns 415 for invalid extension', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Test');
    
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.pdf`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(415);
  });

  // Test 6: Non-existent fragment returns 404
  test('returns 404 for non-existent fragment', async () => {
    const res = await request(app)
      .get('/v1/fragments/nonexistent.html')
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(404);
  });

  // Test 7: Unauthorized access returns 404
  test('cannot convert another user\'s fragment', async () => {
    // User 1 creates fragment
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Private');
    
    const id = postRes.body.fragment.id;

    // User 2 tries to access it
    const res = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user2@email.com', 'password2');

    expect(res.statusCode).toBe(404);
  });

  // Test 8: Unauthenticated request returns 401
  test('unauthenticated request returns 401', async () => {
    const res = await request(app)
      .get('/v1/fragments/someid.html');

    expect(res.statusCode).toBe(401);
  });

  // Test 9: Complex markdown conversion
  test('handles complex markdown with lists and code', async () => {
    const markdown = `# Title

## Subtitle

- Item 1
- Item 2

\`\`\`javascript
const x = 1;
\`\`\``;
    
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(markdown);
    
    const id = postRes.body.fragment.id;

    const res = await request(app)
      .get(`/v1/fragments/${id}.html`)
      .auth('user1@email.com', 'password1');

    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('<h1>Title</h1>');
    expect(res.text).toContain('<h2>Subtitle</h2>');
    expect(res.text).toContain('<li>Item 1</li>');
    expect(res.text).toContain('<code');
  });
});
