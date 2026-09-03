import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createWebHistory } from 'vue-router';

import './style.scss';

import createRouter from './routes';

import App from './App.vue';

import Api from './Api';

const router = createRouter(createWebHistory());

const app = createApp(App);

app.config.globalProperties.$api = Api;

app.use(createPinia()).use(router).mount('#app');
