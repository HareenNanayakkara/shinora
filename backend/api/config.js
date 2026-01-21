const BACKEND_CONFIG = {
  firebase: {
    projectId: "shinora-australia", // ← Put YOUR project ID here
  },
  cloudinary: {
    cloudName: "dq8fvlrqz", // ← Put YOUR cloud name here
    uploadPreset: "shinora", // ← Put YOUR preset name here
  },
};
// Make available globally
if (typeof window !== "undefined") {
  window.BACKEND_CONFIG = BACKEND_CONFIG;
}
