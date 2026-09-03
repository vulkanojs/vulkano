import { createRouter } from 'vue-router';

// Layouts
import Layout from './layouts/Layout.vue';

// Views
import Homepage from './views/Home/Index.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        component: Homepage
      }
    ]
  }
];

export default (history) => {
  return createRouter({ history, routes });
};
