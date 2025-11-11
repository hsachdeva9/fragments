// Use crypto.randomUUID() to create unique IDs, see:
// https://nodejs.org/api/crypto.html#cryptorandomuuidoptions
const { randomUUID } = require('crypto');
// Use https://www.npmjs.com/package/content-type to create/parse Content-Type headers
const contentType = require('content-type');

// Functions for working with fragment metadata/data using our DB
const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data');

const SUPPORTED_TYPES = [
  'text/plain',
  'text/markdown',
  'text/html',
  'text/csv',
  'application/json',
];


class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!ownerId) throw new Error('ownerId is required');
    if (!type) throw new Error('type is required');

    // Allow charset in type but check base type only
    const baseType = contentType.parse(type).type;
    if (!SUPPORTED_TYPES.includes(baseType)) throw new Error(`Unsupported type: ${type}`);

    if (typeof size !== 'number') throw new Error('size must be a number');
    if (size < 0) throw new Error('size cannot be negative');

    this.id = id || randomUUID();
    this.ownerId = ownerId;
    const now = new Date().toISOString();
    this.created = created || now;
    this.updated = updated || now;
    this.type = type;
    this.size = size;
  }

  /**
   * Get all fragments (id or full) for the given user
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns Promise<Array<Fragment>>
   */
  static async byUser(ownerId, expand = false) {
     const list = await listFragments(ownerId);

    if (!expand) return list; 

    // Expand to full Fragment objects
    const fullFragments = [];
    for (const id of list) {
      const data = await readFragment(ownerId, id);
      if (data) fullFragments.push(new Fragment({ ...data, ownerId }));
    }

    return fullFragments;
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<Fragment>
   */
  static async byId(ownerId, id) {
    const fragmentData = await readFragment(ownerId, id);
  if (!fragmentData) throw new Error(`Fragment not found: ${id}`);
  return new Fragment({ ...fragmentData, ownerId });
  }

  /**
   * Delete the user's fragment data and metadata for the given id
   * @param {string} ownerId user's hashed email
   * @param {string} id fragment's id
   * @returns Promise<void>
   */
  static async delete(ownerId, id) {
    await deleteFragment(ownerId, id);
  }

  /**
   * Saves the current fragment (metadata) to the database
   * @returns Promise<void>
   */
  async save() {
    this.updated = new Date().toISOString();
    await writeFragment(this);
  }

  /**
   * Gets the fragment's data from the database
   * @returns Promise<Buffer>
   */
  getData() {
     return readFragmentData(this.ownerId, this.id);
  }

  /**
   * Set's the fragment's data in the database
   * @param {Buffer} data
   * @returns Promise<void>
   */
  async setData(data) {

    if (!Buffer.isBuffer(data)) throw new Error('Data must be a Buffer');

    this.size = data.length;
    this.updated = new Date().toISOString();

    await writeFragmentData(this.ownerId, this.id, data);
    await writeFragment(this); // Update metadata
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html"
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    return contentType.parse(this.type).type;
  }

  /**
   * Returns true if this fragment is a text/* mime type
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return this.mimeType.startsWith('text/');
  }

  /**
   * Returns the formats into which this fragment type can be converted
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
     return this.mimeType === 'text/plain' ? ['text/plain'] : [];
  }

  /**
   * Returns true if we know how to work with this content type
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if we support this Content-Type (i.e., type/subtype)
   */
  static isSupportedType(value) {
    try {
      const baseType = contentType.parse(value).type;
      return SUPPORTED_TYPES.includes(baseType);
    } catch {
      return false;
    }
  }
}

module.exports.Fragment = Fragment;
