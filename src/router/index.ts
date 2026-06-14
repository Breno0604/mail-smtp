// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import FormPage from '@/pages/FormPage.vue';

const routes = [
  {
    path: '/',
    name: 'FormPage',
    component: FormPage,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});