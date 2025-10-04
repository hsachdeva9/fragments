const db = require('../../src/model/data/memory/index.js');

describe('Fragment index functions', () => {
  const ownerId = 'user1';
  const fragmentId = 'frag1';
  const fragment = { id: fragmentId, ownerId, type: 'text/plain' };
  const buffer = Buffer.from('Hello World');

  afterEach(async () => {
      // Clean up after each test
      await db.deleteFragment(ownerId, fragmentId).catch(() => {});
    });


  test('writeFragment and readFragment should work', async () => {
      await db.writeFragment(fragment);
      const result = await db.readFragment(ownerId, fragmentId);
      expect(result).toEqual(fragment);
    });

  test('writeFragmentData and readFragmentData should work', async () => {
    await db.writeFragment(fragment); // metadata needed first
    await db.writeFragmentData(ownerId, fragmentId, buffer);
    const result = await db.readFragmentData(ownerId, fragmentId);
    expect(result).toEqual(buffer);
  });

  test('listFragments returns only IDs by default', async () => {
    await db.writeFragment(fragment);
    const list = await db.listFragments(ownerId);
    expect(list).toContain(fragmentId);
  });

  test('listFragments returns full objects if expand=true', async () => {
  await db.writeFragment(fragment);

  const list = await db.listFragments(ownerId, true);

  // Parse strings into objects for the test
  const parsedList = list.map((item) =>
    typeof item === 'string' ? JSON.parse(item) : item
  );

  expect(parsedList[0]).toEqual(fragment);
  });

  test('deleteFragment removes both metadata and data', async () => {
    await db.writeFragment(fragment);
    await db.writeFragmentData(ownerId, fragmentId, buffer);

    await db.deleteFragment(ownerId, fragmentId);

    const meta = await db.readFragment(ownerId, fragmentId);
    const data = await db.readFragmentData(ownerId, fragmentId);

    expect(meta).toBeUndefined();
    expect(data).toBeUndefined();
  });

  test('readFragment returns undefined for non-existent fragment', async () => {
    const result = await db.readFragment('noUser', 'noId');
    expect(result).toBeUndefined();
  });

  test('readFragmentData returns undefined for non-existent fragment', async () => {
    const result = await db.readFragmentData('noUser', 'noId');
    expect(result).toBeUndefined();
  });
});
