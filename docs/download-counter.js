(() => {
  "use strict";

  const repository = "Dgw3000/sniffy";
  const fallbackUrl =
    `https://github.com/${repository}/releases/latest/download/Sniffy.apk`;

  const counter = document.getElementById("download-count");
  const caption = document.getElementById("download-caption");
  const primaryDownload = document.getElementById("android-download");
  const otherDownloadLinks =
    document.querySelectorAll("[data-android-download]");

  function setDownloadUrl(url) {
    const target = url || fallbackUrl;

    if (primaryDownload) {
      primaryDownload.href = target;
    }

    otherDownloadLinks.forEach((link) => {
      link.href = target;
    });
  }

  function formatNumber(value) {
    return new Intl.NumberFormat("de-DE").format(value);
  }

  const apiUrl =
    `https://api.github.com/repos/${repository}/releases` +
    `?per_page=100&_=${Date.now()}`;

  fetch(apiUrl, {
    cache: "no-store",
    headers: {
      Accept: "application/vnd.github+json"
    }
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(
          `GitHub API antwortete mit HTTP ${response.status}`
        );
      }

      return response.json();
    })
    .then((releases) => {
      const publishedReleases = releases.filter(
        (release) => !release.draft
      );

      const apkAssets = publishedReleases.flatMap((release) =>
        (release.assets || []).filter((asset) =>
          asset.name.toLowerCase().endsWith(".apk")
        )
      );

      const totalDownloads = apkAssets.reduce(
        (sum, asset) =>
          sum + (Number(asset.download_count) || 0),
        0
      );

      const latestRelease =
        publishedReleases.find((release) => !release.prerelease) ||
        publishedReleases[0];

      const latestApk =
        latestRelease?.assets?.find(
          (asset) => asset.name.toLowerCase() === "sniffy.apk"
        ) ||
        latestRelease?.assets?.find(
          (asset) => asset.name.toLowerCase().endsWith(".apk")
        );

      if (counter) {
        counter.textContent =
          totalDownloads === 1
            ? "1 APK-Download"
            : `${formatNumber(totalDownloads)} APK-Downloads`;
      }

      if (caption) {
        caption.textContent =
          totalDownloads === 0
            ? "Noch fabrikfrisch – der erste echte APK-Download fehlt noch."
            : "Gezählt werden die APK-Downloads aller veröffentlichten Releases.";
      }

      setDownloadUrl(latestApk?.browser_download_url);
    })
    .catch((error) => {
      console.error("Sniffy-Downloadzähler:", error);

      if (counter) {
        counter.textContent = "Downloadzähler derzeit nicht erreichbar";
      }

      if (caption) {
        caption.textContent =
          "Der APK-Download funktioniert unabhängig vom Zähler.";
      }

      setDownloadUrl(fallbackUrl);
    });
})();
