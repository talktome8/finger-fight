import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('./features/menu/HomeScreen.vue'),
  },
  {
    path: '/mode',
    name: 'mode-select',
    component: () => import('./features/menu/ModeSelect.vue'),
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('./features/menu/SettingsScreen.vue'),
  },
  {
    path: '/lobby',
    name: 'lobby',
    component: () => import('./features/lobby/LobbyScreen.vue'),
  },
  {
    path: '/join',
    name: 'join',
    component: () => import('./features/lobby/JoinScreen.vue'),
  },
  {
    path: '/game',
    name: 'game',
    component: () => import('./features/gameplay/GameScreen.vue'),
  },
  {
    path: '/results',
    name: 'results',
    component: () => import('./features/gameplay/PodiumScreen.vue'),
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard for leaving mid-match
router.beforeEach((to, from) => {
  if (from.name === 'game' && to.name !== 'results') {
    const confirmed = window.confirm('Leave the match? Your progress will be lost.');
    if (!confirmed) return false;
  }
  return true;
});
