import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import BuffView from "../views/BuffView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/buff", name: "buff", component: BuffView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
