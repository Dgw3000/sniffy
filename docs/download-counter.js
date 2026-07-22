(() => {
  "use strict";

  const repository = "Dgw3000/sniffy";
  const apiUrl = `https://api.github.com/repos/${repository}/releases?per_page=100`;
  const fallbackUrl = `https://github.com/${repository}/releases/latest/download/Sniffy.apk`;
  const cacheKey = "sniffy-release-downloads-v1";
  const cacheLifetimeMs = 10 * 60 * 1000;

  const counter = document.getElementById("download-count");
  const caption = document.getElementById("download-caption");
  const primaryDownload = document.getElementById("android-download");
  const allDownloadLinks = document.querySelectorAll("[data-android-download]");

  const formatNumber = (value) =>
    new Intl.NumberFormat("de-DE").format(Number(value) || 0);

  const applyDownloadUrl = (url) => {
    const target = url || fallbackUrl;

    if (primaryDownload) {
      primaryDownload.href = target;
    }

    allDownloadLinks.forEach((link) => {
      link.href = target;
    });
  };

  const render = (data) => {
    const count = Number(data.totalDownloads) || 0;

    if (counter) {
      counter.textContent =
        count === 1
          ? "1 APK-Download"
          : `${formatNumber(count)} APK-Downloads`;
    }

    if (caption) {
      caption.textContent =
        count === 0
          ? "Noch fabrikfrisch. Oder GitHub zählt gerade mit den Fingern."
          : "Gezählt werden die APK-Downloads aller veröffentlichten GitHub-Releases.";
    }

    applyDownloadUrl(data.latestApkUrl);
  };

  const readCache = () => {
    try {
      const raw = sessionStorage.getItem(cacheKey);
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed.savedAt || Date.now() - parsed.savedAt > cacheLifetimeMs) {
        sessionStorage.removeItem(cacheKey);
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  };

  const writeCache = (data) => {
    try {
      sessionStorage.setItem(
        cacheKey,
        JSON.stringify({ ...data, savedAt: Date.now() })
      );
    } catch {
      // Der Zähler funktioniert auch ohne Browser-Speicher.
    }
  };

  const cached = readCache();
  if (cached) {
    render(cached);
    return;
  }

  fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json"
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`GitHub API: ${response.status}`);
      }
      return response.json();
    })
    .then((releases) => {
      const published = releases.filter((release) => !release.draft);

      const apkAssets = published.flatMap((release) =>
        (release.assets || []).filter((asset) =>
          asset.name.toLowerCase().endsWith(".apk")
        )
      );

      const totalDownloads = apkAssets.reduce(
        (sum, asset) => sum + (Number(asset.download_count) || 0),
        0
      );

      const latestRelease = published.find((release) => !release.prerelease)
        || published[0];

      const latestApk = latestRelease?.assets?.find(
        (asset) => asset.name.toLowerCase() === "sniffy.apk"
      ) || latestRelease?.assets?.find(
        (asset) => asset.name.toLowerCase().endsWith(".apk")
      );

      const data = {
        totalDownloads,
        latestApkUrl: latestApk?.browser_download_url || fallbackUrl
      };

      writeCache(data);
      render(data);
    })
    .catch(() => {
      if (counter) {
        counter.textContent = "Downloadzähler macht gerade Pause";
      }

      if (caption) {
        caption.textContent =
          "Der Android-Download funktioniert trotzdem. Gezählt wird direkt von GitHub.";
      }

      applyDownloadUrl(fallbackUrl);
    });
})();
