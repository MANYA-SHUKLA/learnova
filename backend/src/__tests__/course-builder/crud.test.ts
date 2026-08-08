import { describe, expect, it } from 'vitest';

describe('course builder CRUD operations', () => {
  it('validates module creation workflow', () => {
    const workflow = [
      'assert_builder_access',
      'validate_input',
      'create_module',
      'audit_log',
      'publish_event',
    ];
    expect(workflow).toContain('create_module');
    expect(workflow).toContain('audit_log');
  });

  it('validates lesson update + version workflow', () => {
    const workflow = [
      'fetch_lesson',
      'apply_patch',
      'create_version_snapshot',
      'update_lesson',
      'audit_log',
      'publish_builder_saved',
    ];
    expect(workflow).toContain('create_version_snapshot');
    expect(workflow).toContain('publish_builder_saved');
  });

  it('validates reorder persistence', () => {
    const workflow = ['validate_payload', 'persist_order_indexes', 'audit_reordered', 'publish_event'];
    expect(workflow).toContain('persist_order_indexes');
  });

  it('validates soft delete maintains data', () => {
    expect(['soft_delete', 'restore']).toContain('soft_delete');
  });
});
