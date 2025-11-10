// ใช้ dynamic import โหลดไฟล์ ESM app.js
(async () => {
  try {
    await import("./dist/app.js");
    console.log("✅ App started via server.cjs");
  } catch (err) {
    console.error("❌ Failed to start app:", err);
    process.exit(1);
  }
})();
