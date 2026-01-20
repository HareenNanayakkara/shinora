// backend/api/firebase-api.js
// Firebase REST API functions

const FirebaseBackendAPI = {
  get projectId() {
    return BACKEND_CONFIG.firebase.projectId;
  },

  // Make Firestore request
  async request(method, path, data = null) {
    const url = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents${path}`;

    const options = {
      method: method,
      headers: { "Content-Type": "application/json" },
    };

    if (data && (method === "POST" || method === "PATCH")) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  },

  // Convert Firestore document to JavaScript object
  convertDoc(doc) {
    if (!doc || !doc.fields) return null;

    const data = {
      id: doc.name ? doc.name.split("/").pop() : null,
    };

    const fields = doc.fields;

    for (const key in fields) {
      const field = fields[key];

      if (field.stringValue !== undefined) {
        data[key] = field.stringValue;
      } else if (field.integerValue !== undefined) {
        data[key] = parseInt(field.integerValue);
      } else if (field.doubleValue !== undefined) {
        data[key] = parseFloat(field.doubleValue);
      } else if (field.booleanValue !== undefined) {
        data[key] = field.booleanValue;
      } else if (field.arrayValue && field.arrayValue.values) {
        data[key] = field.arrayValue.values.map(
          (v) =>
            v.stringValue ||
            v.integerValue ||
            v.doubleValue ||
            v.booleanValue ||
            null,
        );
      }
    }

    return data;
  },

  // Convert JavaScript object to Firestore format
  toFirestoreFormat(data) {
    const fields = {};

    for (const key in data) {
      const value = data[key];

      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        fields[key] = {
          arrayValue: {
            values: value.map((v) => {
              if (typeof v === "string") return { stringValue: v };
              if (typeof v === "number") {
                return Number.isInteger(v)
                  ? { integerValue: v }
                  : { doubleValue: v };
              }
              if (typeof v === "boolean") return { booleanValue: v };
              return { stringValue: String(v) };
            }),
          },
        };
      } else if (typeof value === "string") {
        fields[key] = { stringValue: value };
      } else if (typeof value === "number") {
        fields[key] = Number.isInteger(value)
          ? { integerValue: value }
          : { doubleValue: value };
      } else if (typeof value === "boolean") {
        fields[key] = { booleanValue: value };
      }
    }

    return { fields };
  },
  // Check authentication before write operations
  checkAuth() {
    if (!window.FirebaseAuth || !FirebaseAuth.isAuthenticated()) {
      throw new Error("⛔ Unauthorized: Please login first");
    }
  },

  // ===== PRODUCT FUNCTIONS =====

  // Get all products
  async getAllProducts() {
    try {
      const result = await this.request("GET", "/products");

      if (!result.documents) return [];

      return result.documents
        .map((doc) => this.convertDoc(doc))
        .filter((p) => p !== null)
        .sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(category) {
    try {
      const allProducts = await this.getAllProducts();
      return allProducts.filter((p) => p.category === category);
    } catch (error) {
      console.error("Error getting products by category:", error);
      return [];
    }
  },

  // Get single product by ID
  async getProductById(productId) {
    try {
      const result = await this.request("GET", `/products/${productId}`);
      return this.convertDoc(result);
    } catch (error) {
      console.error("Error getting product:", error);
      return null;
    }
  },

  // Add new product
  async addProduct(productData) {
    this.checkAuth();
    try {
      const timestamp = new Date().toISOString();
      productData.createdAt = timestamp;
      productData.updatedAt = timestamp;

      const firestoreData = this.toFirestoreFormat(productData);
      const result = await this.request("POST", "/products", firestoreData);
      return this.convertDoc(result);
    } catch (error) {
      console.error("Error adding product:", error);
      throw error;
    }
  },

  // Update product
  async updateProduct(productId, productData) {
    this.checkAuth();
    try {
      productData.updatedAt = new Date().toISOString();
      const firestoreData = this.toFirestoreFormat(productData);
      const result = await this.request(
        "PATCH",
        `/products/${productId}`,
        firestoreData,
      );
      return this.convertDoc(result);
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  // Delete product
  async deleteProduct(productId) {
    this.checkAuth();
    try {
      await this.request("DELETE", `/products/${productId}`);
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // ===== GALLERY FUNCTIONS (Images) =====

  // Get all gallery images
  async getAllGalleryImages() {
    try {
      const result = await this.request("GET", "/gallery");
      if (!result.documents) return [];
      return result.documents
        .map((doc) => this.convertDoc(doc))
        .filter((img) => img !== null)
        .sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
    } catch (error) {
      console.error("Error getting gallery:", error);
      return [];
    }
  },

  // Add gallery image
  async addGalleryImage(imageData) {
    this.checkAuth();
    try {
      imageData.createdAt = new Date().toISOString();
      const firestoreData = this.toFirestoreFormat(imageData);
      const result = await this.request("POST", "/gallery", firestoreData);
      return this.convertDoc(result);
    } catch (error) {
      console.error("Error adding gallery image:", error);
      throw error;
    }
  },

  // Delete gallery image
  async deleteGalleryImage(imageId) {
    this.checkAuth();
    try {
      await this.request("DELETE", `/gallery/${imageId}`);
      return true;
    } catch (error) {
      console.error("Error deleting gallery image:", error);
      throw error;
    }
  },

  // ===== VIDEO FUNCTIONS =====

  // Get all videos
  async getAllVideos() {
    try {
      const result = await this.request("GET", "/videos");
      if (!result.documents) return [];
      return result.documents
        .map((doc) => this.convertDoc(doc))
        .filter((vid) => vid !== null)
        .sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
    } catch (error) {
      console.error("Error getting videos:", error);
      return [];
    }
  },

  // Add video
  async addVideo(videoData) {
    this.checkAuth();
    try {
      videoData.createdAt = new Date().toISOString();
      const firestoreData = this.toFirestoreFormat(videoData);
      const result = await this.request("POST", "/videos", firestoreData);
      return this.convertDoc(result);
    } catch (error) {
      console.error("Error adding video:", error);
      throw error;
    }
  },

  // Delete video
  async deleteVideo(videoId) {
    this.checkAuth();
    try {
      await this.request("DELETE", `/videos/${videoId}`);
      return true;
    } catch (error) {
      console.error("Error deleting video:", error);
      throw error;
    }
  },
};

// Make available globally
if (typeof window !== "undefined") {
  window.FirebaseBackendAPI = FirebaseBackendAPI;
}
