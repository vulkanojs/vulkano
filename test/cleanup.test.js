import { describe, it, expect } from 'vitest';
import cleanupModule from '../scripts/cleanup.js';

const { stripHelloWorldTemplate, stripHelloWorldScript, CLEANUP_TARGETS } = cleanupModule;

describe('stripHelloWorldTemplate', () => {
  it('removes the HelloWorld tag and collapses the surrounding blank lines', () => {
    const source = [
      '<template>',
      '',
      '  <div class="home">',
      '    <a href="https://github.com/vulkanojs/vulkano" target="_blank">',
      '      <img src="/img/vulkano-logo-optimized.png" alt="Vulkano logo" />',
      '    </a>',
      '  </div>',
      '',
      '  <HelloWorld msg="Vulkano + Vite Plus + Vue 3" />',
      '',
      '  <p>',
      '    Edit',
      '  </p>',
      '',
      '</template>',
      '',
      '<script src="./Index.js"></script>',
      ''
    ].join('\n');

    const result = stripHelloWorldTemplate(source);

    expect(result).not.toContain('HelloWorld');
    expect(result).toBe(
      [
        '<template>',
        '',
        '  <div class="home">',
        '    <a href="https://github.com/vulkanojs/vulkano" target="_blank">',
        '      <img src="/img/vulkano-logo-optimized.png" alt="Vulkano logo" />',
        '    </a>',
        '  </div>',
        '',
        '  <p>',
        '    Edit',
        '  </p>',
        '',
        '</template>',
        '',
        '<script src="./Index.js"></script>',
        ''
      ].join('\n')
    );
  });
});

describe('stripHelloWorldScript', () => {
  it('removes the import and the components entry', () => {
    const source = [
      "import HelloWorld from '../../components/HelloWorld/HelloWorld.vue';",
      '',
      'export default {',
      '',
      '  components: {',
      '',
      '    HelloWorld',
      '',
      '  },',
      '',
      '  setup() {',
      '',
      '    return {',
      '',
      '    };',
      '',
      '  }',
      '',
      '};',
      ''
    ].join('\n');

    const result = stripHelloWorldScript(source);

    expect(result).not.toContain('HelloWorld');
    expect(result).toBe(
      [
        'export default {',
        '',
        '  components: {',
        '',
        '  },',
        '',
        '  setup() {',
        '',
        '    return {',
        '',
        '    };',
        '',
        '  }',
        '',
        '};',
        ''
      ].join('\n')
    );
  });
});

describe('CLEANUP_TARGETS', () => {
  it('lists the demo folder/file paths, with app/controllers/api as a whole folder', () => {
    expect(CLEANUP_TARGETS).toEqual([
      'app/controllers/api',
      'app/models/Example.js',
      'app/models/ExampleWithScaffold.js',
      'frontend/website/components/HelloWorld',
      'frontend/website/views/Demo',
      'app/views/demo'
    ]);
  });
});
