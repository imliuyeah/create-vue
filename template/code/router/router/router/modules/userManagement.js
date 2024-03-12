const Layout = () => import('@/layout/Layout.vue')

const userManagerRouter = [
  {
    path: '/',
    component: Layout,
    redirect: '/home',
    name: 'Home',
    meta: {},
    children: [
      {
        path: 'home',
        component: () => import('@/pages/home/Home.vue'),
        name: 'home',
        meta: {
          title: '首页',
          icon: 'ep:home-filled',
          noCache: false,
          affix: true
        }
      }
    ]
  }
]

export default userManagerRouter
