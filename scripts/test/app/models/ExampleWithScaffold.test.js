import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { waitForReady } from '../../helpers/bootstrap.js';
import { clearCollections } from '../../helpers/dbCleanup.js';

describe('ExampleWithScaffold model (core scaffold defaults)', () => {
  beforeAll(() => waitForReady());
  afterEach(() => clearCollections('ExampleWithScaffold'));

  it('creates a record with valid attributes', async () => {
    const record = await ExampleWithScaffold.create({ name: 'Valid Example', age: 21 });

    expect(record.name).toBe('Valid Example');
    expect(record.age).toBe(21);
    expect(record.active).toBe(true);
  });

  it('rejects a record with no name', async () => {
    await expect(ExampleWithScaffold.create({ age: 21 })).rejects.toThrow();
  });

  it('rejects a record with age under 21', async () => {
    await expect(ExampleWithScaffold.create({ name: 'Too Young', age: 20 })).rejects.toThrow('Invalid Age: Must be +21.');
  });

  it('reads a record by id via getExampleWithScaffold (alias to getByField)', async () => {
    const created = await ExampleWithScaffold.create({ name: 'Findable', age: 30 });

    const found = await ExampleWithScaffold.getExampleWithScaffold(created._id.toString());

    expect(found.name).toBe('Findable');
  });

  it('lists records via getAllExampleWithScaffold (alias to getAll)', async () => {
    await ExampleWithScaffold.create({ name: 'Listed One', age: 25 });
    await ExampleWithScaffold.create({ name: 'Listed Two', age: 26 });

    const { items } = await ExampleWithScaffold.getAllExampleWithScaffold({});

    expect(items.length).toBe(2);
  });

  it('updates only fillable fields (name, age) and ignores the rest', async () => {
    const created = await ExampleWithScaffold.create({ name: 'Original Name', age: 30 });

    const updated = await ExampleWithScaffold.update(created._id.toString(), {
      name: 'Updated Name',
      active: false // not in `fillable` — must be silently dropped, not applied
    });

    expect(updated.name).toBe('Updated Name');
    expect(updated.active).toBe(true);
  });

  it('known core gap: delete() does NOT soft-delete when fillable excludes "active"', async () => {
    // scaffold.delete() (database/scaffold.js) calls this.update(id, { active: false }), but
    // scaffold.update() filters the payload down to `fillable` when it's defined and non-empty.
    // This model's fillable is ['name', 'age'] (no 'active'), so `active: false` gets stripped
    // before the merge — the record is never actually deactivated. Add 'active' to `fillable`
    // in app/models/ExampleWithScaffold.js if this model needs working soft-delete.
    const created = await ExampleWithScaffold.create({ name: 'To Delete', age: 25 });

    const deleted = await ExampleWithScaffold.delete(created._id.toString());

    expect(deleted.active).toBe(true); // should be false — documents the current core behavior, not the desired one
  });

  it('rejects getByField with a malformed id and no field', async () => {
    await expect(ExampleWithScaffold.getByField('not-an-id')).rejects.toThrow('Invalid ID. Record not found.');
  });

  it('rejects getByField with a well-formed id that does not exist', async () => {
    await expect(ExampleWithScaffold.getByField('64b64f0f0f0f0f0f0f0f0f0f')).rejects.toThrow('Not Found');
  });
});
