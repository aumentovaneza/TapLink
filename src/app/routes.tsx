import { createBrowserRouter } from "react-router";
import { Root } from "./layouts/Root";
import { Landing } from "./pages/Landing";
import { TemplateGallery } from "./pages/TemplateGallery";
import { ProfileEditor } from "./pages/ProfileEditor";
import { ProfileView } from "./pages/ProfileView";
import { AdminDashboard } from "./pages/AdminDashboard";
import { AdminProfiles } from "./pages/admin/AdminProfiles";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminNfcTags } from "./pages/admin/AdminNfcTags";
import { AdminSettings } from "./pages/admin/AdminSettings";
import { TagScan } from "./pages/TagScan";
import { ClaimFlow } from "./pages/ClaimFlow";
import { Login } from "./pages/Login";
import { MyTags } from "./pages/MyTags";
import { TagAnalytics } from "./pages/TagAnalytics";
import { TagResponses } from "./pages/TagResponses";
import { NotFound } from "./pages/NotFound";
import { RedirectAuthenticatedFromLogin, RequireAdmin, RequireAuth } from "./components/auth/RouteGuards";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      // ── Existing pages (unchanged) ─────────────────────────────────────────
      { index: true,              Component: Landing },
      { path: "templates",        Component: TemplateGallery },
      { path: "editor",           Component: ProfileEditor },
      { path: "profile/:id",      Component: ProfileView },
      { path: "profile",          Component: ProfileView },

      // ── Other pages ────────────────────────────────────────────────────────
      { path: "scan",             Component: TagScan },
      { path: "scan/:tagId",      Component: TagScan },
      { path: "claim",            Component: ClaimFlow },
      { path: "claim/:code",      Component: ClaimFlow },
      {
        Component: RedirectAuthenticatedFromLogin,
        children: [{ path: "login", Component: Login }],
      },
      {
        Component: RequireAuth,
        children: [
          { path: "my-tags", Component: MyTags },
          { path: "my-tags/:tagId/responses", Component: TagResponses },
          { path: "analytics/:tagId", Component: TagAnalytics },
        ],
      },
      {
        Component: RequireAdmin,
        children: [
          { path: "dashboard", Component: AdminDashboard },
          { path: "dashboard/profiles", Component: AdminProfiles },
          { path: "dashboard/analytics", Component: AdminAnalytics },
          { path: "dashboard/tags", Component: AdminNfcTags },
          { path: "dashboard/settings", Component: AdminSettings },
        ],
      },

      { path: "*",                Component: NotFound },
    ],
  },
]);
