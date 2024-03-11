import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import userManagerRouter from './modules/userManagement'

const router = createRouter({
  history: createWebHistory(),
  routes: [...userManagerRouter] as RouteRecordRaw[]
})

export default router
