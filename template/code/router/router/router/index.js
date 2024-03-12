import { createRouter, createWebHistory } from 'vue-router'
import userManagerRouter from './modules/userManagement'

const router = createRouter({
  history: createWebHistory(),
  routes: [...userManagerRouter]
})

export default router
