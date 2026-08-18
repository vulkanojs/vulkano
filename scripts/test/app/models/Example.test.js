import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { waitForReady } from '../../helpers/bootstrap.js';
import { clearCollections } from '../../helpers/dbCleanup.js';

describe('Example model', () => {
  beforeAll(() => waitForReady());
  afterEach(() => clearCollections('Example'));

  it('creates a record with valid attributes', async () => {
    const record = await Example.create({ name: 'Valid Example', age: 21 });

    expect(record.name).toBe('Valid Example');
    expect(record.age).toBe(21);
    expect(record.active).toBe(true);
  });

  it('rejects a record with no name', async () => {
    await expect(Example.create({ age: 21 })).rejects.toThrow();
  });

  it('rejects a record with age under 21', async () => {
    await expect(Example.create({ name: 'Too Young', age: 20 })).rejects.toThrow('Invalid Age: Must be +21.');
  });

  it('updates a record by id', async () => {
    const created = await Example.create({ name: 'Original Name', age: 30 });

    const updated = await Example.update(created._id.toString(), { name: 'Updated Name' });

    expect(updated.name).toBe('Updated Name');
  });

  it('soft-deletes a record by setting active to false', async () => {
    const created = await Example.create({ name: 'To Delete', age: 25 });

    const deleted = await Example.delete(created._id.toString());

    expect(deleted.active).toBe(false);
  });

  it('rejects getExample with a malformed id', async () => {
    await expect(Example.getExample('not-an-id')).rejects.toThrow('Invalid ID. Record not found');
  });

  it('rejects getExample with a well-formed id that does not exist', async () => {
    await expect(Example.getExample('64b64f0f0f0f0f0f0f0f0f0f')).rejects.toThrow('Not Found');
  });
});
