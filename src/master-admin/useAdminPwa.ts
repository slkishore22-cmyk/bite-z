import { useEffect } from "react";

/**
 * Swap the document's <link rel="manifest"> to the admin manifest while a
 * Master Admin page is mounted. Restores the original (user) manifest on
 * unmount so installs from the user app keep their identity.
 */
export function useAdminPwa() {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    const prevHref = link?.getAttribute("href") ?? null;
    if (link) link.setAttribute("href", "/manifest-admin.webmanifest");

    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const prevTheme = themeMeta?.getAttribute("content") ?? null;
    themeMeta?.setAttribute("content", "#0A0A0F");

    const appleTitle = document.querySelector<HTMLMetaElement>('meta[name="apple-mobile-web-app-title"]');
    const prevAppleTitle = appleTitle?.getAttribute("content") ?? null;
    appleTitle?.setAttribute("content", "Bitez Admin");

    return () => {
      if (link && prevHref) link.setAttribute("href", prevHref);
      if (themeMeta && prevTheme) themeMeta.setAttribute("content", prevTheme);
      if (appleTitle && prevAppleTitle) appleTitle.setAttribute("content", prevAppleTitle);
    };
  }, []);
}