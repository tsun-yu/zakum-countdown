import { createRouter, createWebHashHistory } from "vue-router";
import HomeView from "../views/HomeView.vue";
import BuffView from "../views/BuffView.vue";
import HorntailView from "../views/HorntailView.vue";
import KrexelView from "../views/KrexelView.vue";

const routes = [
  { path: "/", name: "home", component: HomeView },
  { path: "/buff", name: "buff", component: BuffView },
  { path: "/horntail", name: "horntail", component: HorntailView },
  { path: "/krexel", name: "krexel", component: KrexelView },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
