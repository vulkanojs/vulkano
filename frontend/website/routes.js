import { createRouter } from 'vue-router';

// Layouts
import Layout from './layouts/Layout.vue';

// Views
import Homepage from './views/Home/Index.vue';
import NotFound from './views/NotFound/Index.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        component: Homepage
      },
      // Design system reference — dev only, tree-shaken from production builds
      ...(import.meta.env.DEV
        ? [{ path: 'design-system', component: () => import('./views/DesignSystem/Index.vue') }]
        : []),
      {
        path: ':pathMatch(.*)*',
        component: NotFound
      }
    ]
  }
];

export default (history) => {
  return createRouter({ history, routes });
};
