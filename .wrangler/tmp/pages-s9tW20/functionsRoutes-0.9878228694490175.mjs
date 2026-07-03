import { onRequestPost as __api_admin_images_upload_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/admin/images/upload.js"
import { onRequestDelete as __api_admin_links__id__js_onRequestDelete } from "/Users/mpa014/Code/robotysnet/functions/api/admin/links/[id].js"
import { onRequestPut as __api_admin_links__id__js_onRequestPut } from "/Users/mpa014/Code/robotysnet/functions/api/admin/links/[id].js"
import { onRequestGet as __api_admin_posts__uuid__js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/admin/posts/[uuid].js"
import { onRequestPut as __api_admin_posts__uuid__js_onRequestPut } from "/Users/mpa014/Code/robotysnet/functions/api/admin/posts/[uuid].js"
import { onRequestGet as __api_admin_links_index_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/admin/links/index.js"
import { onRequestPost as __api_admin_links_index_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/admin/links/index.js"
import { onRequestGet as __api_admin_posts_index_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/admin/posts/index.js"
import { onRequestPost as __api_admin_posts_index_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/admin/posts/index.js"
import { onRequestGet as __api_apps_check_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/apps/check.js"
import { onRequestPost as __api_auth_login_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/auth/login.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/auth/logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/auth/me.js"
import { onRequestPost as __api_auth_register_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/auth/register.js"
import { onRequestGet as __api_auth_setup_status_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/auth/setup-status.js"
import { onRequestPost as __api_auth_upgrade_js_onRequestPost } from "/Users/mpa014/Code/robotysnet/functions/api/auth/upgrade.js"
import { onRequestGet as __api_links_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/links.js"
import { onRequestGet as __api_posts_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/api/posts.js"
import { onRequestGet as __images__filename__js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/images/[filename].js"
import { onRequestGet as __post__slug__js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/post/[slug].js"
import { onRequest as __admin___path___js_onRequest } from "/Users/mpa014/Code/robotysnet/functions/admin/[[path]].js"
import { onRequestGet as __sitemap_xml_js_onRequestGet } from "/Users/mpa014/Code/robotysnet/functions/sitemap.xml.js"
import { onRequest as __posts_index_js_onRequest } from "/Users/mpa014/Code/robotysnet/functions/posts/index.js"
import { onRequest as __index_js_onRequest } from "/Users/mpa014/Code/robotysnet/functions/index.js"

export const routes = [
    {
      routePath: "/api/admin/images/upload",
      mountPath: "/api/admin/images",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_images_upload_js_onRequestPost],
    },
  {
      routePath: "/api/admin/links/:id",
      mountPath: "/api/admin/links",
      method: "DELETE",
      middlewares: [],
      modules: [__api_admin_links__id__js_onRequestDelete],
    },
  {
      routePath: "/api/admin/links/:id",
      mountPath: "/api/admin/links",
      method: "PUT",
      middlewares: [],
      modules: [__api_admin_links__id__js_onRequestPut],
    },
  {
      routePath: "/api/admin/posts/:uuid",
      mountPath: "/api/admin/posts",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_posts__uuid__js_onRequestGet],
    },
  {
      routePath: "/api/admin/posts/:uuid",
      mountPath: "/api/admin/posts",
      method: "PUT",
      middlewares: [],
      modules: [__api_admin_posts__uuid__js_onRequestPut],
    },
  {
      routePath: "/api/admin/links",
      mountPath: "/api/admin/links",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_links_index_js_onRequestGet],
    },
  {
      routePath: "/api/admin/links",
      mountPath: "/api/admin/links",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_links_index_js_onRequestPost],
    },
  {
      routePath: "/api/admin/posts",
      mountPath: "/api/admin/posts",
      method: "GET",
      middlewares: [],
      modules: [__api_admin_posts_index_js_onRequestGet],
    },
  {
      routePath: "/api/admin/posts",
      mountPath: "/api/admin/posts",
      method: "POST",
      middlewares: [],
      modules: [__api_admin_posts_index_js_onRequestPost],
    },
  {
      routePath: "/api/apps/check",
      mountPath: "/api/apps",
      method: "GET",
      middlewares: [],
      modules: [__api_apps_check_js_onRequestGet],
    },
  {
      routePath: "/api/auth/login",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_login_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/register",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_register_js_onRequestPost],
    },
  {
      routePath: "/api/auth/setup-status",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_setup_status_js_onRequestGet],
    },
  {
      routePath: "/api/auth/upgrade",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_upgrade_js_onRequestPost],
    },
  {
      routePath: "/api/links",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_links_js_onRequestGet],
    },
  {
      routePath: "/api/posts",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_posts_js_onRequestGet],
    },
  {
      routePath: "/images/:filename",
      mountPath: "/images",
      method: "GET",
      middlewares: [],
      modules: [__images__filename__js_onRequestGet],
    },
  {
      routePath: "/post/:slug",
      mountPath: "/post",
      method: "GET",
      middlewares: [],
      modules: [__post__slug__js_onRequestGet],
    },
  {
      routePath: "/admin/:path*",
      mountPath: "/admin",
      method: "",
      middlewares: [],
      modules: [__admin___path___js_onRequest],
    },
  {
      routePath: "/sitemap.xml",
      mountPath: "/",
      method: "GET",
      middlewares: [],
      modules: [__sitemap_xml_js_onRequestGet],
    },
  {
      routePath: "/posts",
      mountPath: "/posts",
      method: "",
      middlewares: [],
      modules: [__posts_index_js_onRequest],
    },
  {
      routePath: "/",
      mountPath: "/",
      method: "",
      middlewares: [],
      modules: [__index_js_onRequest],
    },
  ]