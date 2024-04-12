import { createApp } from 'vue';
import { createWebHistory } from 'vue-router';

import '@client/style.scss';

import createRouter from '@client/routes';

import App from '@client/App.vue';

import Api from '@client/Api';

const router = createRouter(createWebHistory());

const app = createApp(App);

app.config.globalProperties.$api = Api;

app.use(router)
  .mount('#app');
