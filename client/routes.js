import { createRouter } from 'vue-router';

// Layouts
import Layout from '@client/layouts/Layout.vue';

// Views
import Homepage from '@client/views/Home/Home.vue';

const routes = [
  {
    path: '/',
    component: Layout,
    children: [
      {
        path: '',
        component: Homepage
      },
    ],
  }
];

export default (history) => {
  return createRouter({ history, routes });
};
