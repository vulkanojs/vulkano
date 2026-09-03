<template>
  <div class="home">
    <a href="https://github.com/vulkanojs/vulkano" target="_blank">
      <img src="/img/vulkano-logo-optimized.png" alt="Vulkano logo" />
    </a>
    <a href="https://viteplus.dev" target="_blank">
      <img src="/img/vite/vite+.svg" alt="Vite Plus logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="/img/vite/vue.svg" alt="Vue logo" />
    </a>
  </div>

  <HelloWorld msg="Vulkano + Vite Plus + Vue 3" />

  <p>
    Edit Current View:
    <code>/views/Home/Index.vue</code> to test HMR
  </p>

  <div class="ai-cheatsheet">
    <h2 class="ai-cheatsheet__title">Talking to your AI agent</h2>
    <p class="ai-cheatsheet__intro"
      >Try prompts like these — the agent follows the conventions in <code>AGENTS.md</code> /
      <code>ARCHITECTURE.md</code>:</p
    >
    <div class="ai-cheatsheet__group">
      <h3 class="ai-cheatsheet__group-title">Frontend: Vue SPA</h3>
      <ul class="ai-cheatsheet__list">
        <li class="ai-cheatsheet__item"><code>create a view to show [table] records</code></li>
        <li class="ai-cheatsheet__item"><code>create a route to create a form</code></li>
        <li class="ai-cheatsheet__item"><code>add a PostCard component</code></li>
      </ul>
    </div>

    <div class="ai-cheatsheet__group">
      <h3 class="ai-cheatsheet__group-title">Backend: Server Side</h3>
      <ul class="ai-cheatsheet__list">
        <li class="ai-cheatsheet__item"><code>add a [table] model with fields [...]</code></li>
        <li class="ai-cheatsheet__item"
          ><code>add a route to save [table] to the database (domain.com/api/[table])</code></li
        >
        <li class="ai-cheatsheet__item"
          ><code>create a backend view to show [table] records</code></li
        >
      </ul>
    </div>

    <ul class="ai-cheatsheet__list">
      <li class="ai-cheatsheet__item"
        ><code>run pnpm run setup</code> — strip this demo homepage</li
      >
    </ul>
  </div>
</template>

<script src="./Index.js"></script>
