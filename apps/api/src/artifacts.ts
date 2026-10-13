/** Presentation metadata derived from the file, never its workspace prefix. */
export function artifactMetadata(path: string): { category: string; mimeType: string } {
  const name = (path.split("/").pop() ?? path).toLowerCase();
  const extension = name.split(".").pop() ?? "";
  const media: Record<string, [string, string]> = {
    jpg: ["frame", "image/jpeg"], jpeg: ["frame", "image/jpeg"],
    png: ["frame", "image/png"], webp: ["frame", "image/webp"],
    mp4: ["video", "video/mp4"], mov: ["video", "video/quicktime"],
    webm: ["video", "video/webm"], wav: ["audio", "audio/wav"],
    mp3: ["audio", "audio/mpeg"], m4a: ["audio", "audio/mp4"],
    ogg: ["audio", "audio/ogg"], flac: ["audio", "audio/flac"],
  };
  if (Object.hasOwn(media, extension)) {
    const [category, mimeType] = media[extension];
    return { category, mimeType };
  }
  if (extension === "json") {
    const category = name.includes("manifest") ? "manifest" : name.includes("report") ? "report" : "other";
    return { category, mimeType: "application/json" };
  }
  return { category: "other", mimeType: "application/octet-stream" };
}
