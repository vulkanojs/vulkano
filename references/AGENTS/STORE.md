# State — `frontend/<entrypoint>/store/`

See [FRONTEND.md](FRONTEND.md) for general frontend conventions and [ARCHITECTURE.md](ARCHITECTURE.md) for the project structure overview.

Keep state in [Pinia](https://pinia.vuejs.org/) rather than local component `ref`/`reactive`, especially for anything worth surviving a re-render: component-local state resets whenever HMR can't hot-swap a module in place and falls back to a full reload, while state in a store is less likely to be lost across that reload.

Split state into one Pinia store per concern — not one global store. If a payload carries data for multiple entities (e.g. an event, its attendee, and a campaign), split it into independent stores rather than one combined store:

```
store/
  useEventStore.js
  useAttendeeStore.js
  useCampaignStore.js
```

Each store owns only its own entity's state, getters, and actions — a component importing `useAttendeeStore` should never need to reach into event or campaign state. This keeps each store small, its logic easy to follow, and its mutations traceable to one concern instead of a shared blob every component can write to.

```js
// store/useEventStore.js
import { ref, getCurrentInstance } from 'vue';
import { defineStore } from 'pinia';

export const useEventStore = defineStore('event', () => {
  const { $api } = getCurrentInstance().proxy || {};
  const current = ref(null);

  async function fetch(id) {
    current.value = await $api.get(`/event/${id}`);
  }

  return { current, fetch };
});
```

(setup-style store, in line with the Composition API preference — not the options-style `defineStore('event', { state, actions })`.)

Naming: `use<Entity>Store` (singular, matching the model naming convention), file per store, no aggregator/barrel file — import each store directly where it's used.

Pinia is installed by default (`app.use(createPinia())` already registered in each entrypoint's `app.js`, e.g. `frontend/website/app.js`) — just create the store file.

## Global app-shell state — `useAppStore`

App-shell-level state — things there's only ever one of, shared across the whole app regardless of route — lives in a single `useAppStore`, not split per concern like entity stores: a global loading spinner, Socket.io connection status (`connected`/`reconnecting`/`disconnected`), a sidebar-open flag, a theme toggle. This is the one deliberate exception to "one store per concern": these are all facets of the same app shell, read/written from unrelated places (a router guard, the socket client, any component), so bundling them in one store avoids a proliferation of near-empty singleton stores. Entity data (`useEventStore`, etc.) still stays split — this exception is for app-shell/UI state only. Applies to any area of the app (public site, CMS/admin, widget) that needs this kind of shared state:

```js
// store/useAppStore.js
import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useAppStore = defineStore('app', () => {
  const isLoading = ref(false);
  const socketStatus = ref('disconnected'); // 'connected' | 'reconnecting' | 'disconnected'

  function setLoadingStatus(status) {
    isLoading.value = status;
  }

  function setSocketStatus(status) {
    socketStatus.value = status;
  }

  return { isLoading, socketStatus, setLoadingStatus, setSocketStatus };
});
```

**Testing** — each store gets its own test file (e.g. `test/frontend/<entrypoint>/store/useEventStore.test.js`), independent of other stores' tests. Because stores are split by concern, tests can exercise one store's actions/getters in isolation, with `createPinia()` + `setActivePinia()` in `beforeEach`, without needing to set up unrelated entity state. Mock `$api` calls at the store boundary rather than hitting the real API. Full pattern table (store, composable, util): `.claude/skills/vulkano-skills/vulkano-testing/SKILL.md`, [TESTING.md](TESTING.md).
