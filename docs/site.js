(() => {
  "use strict";

  const repository = "Dgw3000/sniffy";
  const fallbackUrl =
    `https://github.com/${repository}/releases/latest/download/Sniffy.apk`;
  const apiUrl =
    `https://api.github.com/repos/${repository}/releases?per_page=100&_=${Date.now()}`;

  const counter = document.getElementById("download-count");
  const caption = document.getElementById("download-caption");
  const downloadLink = document.getElementById("android-download");

  const setDownloadUrl = (url) => {
    if (downloadLink) downloadLink.href = url || fallbackUrl;
  };

  const format = (value) =>
    new Intl.NumberFormat("de-DE").format(Number(value) || 0);

  fetch(apiUrl, {
    cache: "no-store",
    headers: { Accept: "application/vnd.github+json" }
  })
    .then((response) => {
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
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

      const latestRelease =
        published.find((release) => !release.prerelease) || published[0];

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
            : `${format(totalDownloads)} APK-Downloads`;
      }

      if (caption) {
        caption.textContent =
          "Gezählt werden Downloads aller veröffentlichten APK-Releases.";
      }

      setDownloadUrl(latestApk?.browser_download_url);
    })
    .catch((error) => {
      console.error("Downloadzähler:", error);
      if (counter) counter.textContent = "Downloadzähler derzeit nicht erreichbar";
      if (caption) caption.textContent = "Der Android-Download funktioniert trotzdem.";
      setDownloadUrl(fallbackUrl);
    });
})();
