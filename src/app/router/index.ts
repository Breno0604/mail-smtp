import { createRouter, createWebHistory } from 'vue-router'
import FormPage from '../../pages/FormPage.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'form',
      component: FormPage,
    },
  ],
})

export default router
