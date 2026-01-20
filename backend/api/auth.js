// backend/api/auth.js
// Firebase-based Authentication System

const FirebaseAuth = {
  currentUser: null,
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours

  // Initialize - Check if user is already logged in
  init() {
    const savedUser = localStorage.getItem("adminSession");
    if (savedUser) {
      const session = JSON.parse(savedUser);

      // Check if session is still valid
      const now = new Date().getTime();
      if (now - session.loginTime < this.sessionTimeout) {
        this.currentUser = session;
        return true;
      } else {
        // Session expired
        this.logout();
      }
    }
    return false;
  },

  // Hash password using SHA-256
  async hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  },

  // Get user from Firebase by username
  async getUserByUsername(username) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${BACKEND_CONFIG.firebase.projectId}/databases/(default)/documents/users`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.documents) return null;

      // Find user with matching username
      for (const doc of data.documents) {
        const fields = doc.fields;
        if (fields.username && fields.username.stringValue === username) {
          return {
            id: doc.name.split("/").pop(),
            username: fields.username.stringValue,
            passwordHash: fields.passwordHash.stringValue,
            role: fields.role ? fields.role.stringValue : "admin",
            email: fields.email ? fields.email.stringValue : "",
            active: fields.active ? fields.active.booleanValue : true,
            createdAt: fields.createdAt ? fields.createdAt.stringValue : null,
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  },

  // Create new user in Firebase
  async createUser(userData) {
    try {
      const hashedPassword = await this.hashPassword(userData.password);

      const firestoreData = {
        fields: {
          username: { stringValue: userData.username },
          passwordHash: { stringValue: hashedPassword },
          email: { stringValue: userData.email || "" },
          role: { stringValue: userData.role || "admin" },
          active: { booleanValue: true },
          createdAt: { stringValue: new Date().toISOString() },
        },
      };

      const url = `https://firestore.googleapis.com/v1/projects/${BACKEND_CONFIG.firebase.projectId}/databases/(default)/documents/users`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(firestoreData),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log("✅ User created successfully");
      return {
        id: result.name.split("/").pop(),
        username: userData.username,
        email: userData.email || "",
        role: userData.role || "admin",
      };
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${BACKEND_CONFIG.firebase.projectId}/databases/(default)/documents/users`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.documents) return [];

      return data.documents.map((doc) => {
        const fields = doc.fields;
        return {
          id: doc.name.split("/").pop(),
          username: fields.username.stringValue,
          email: fields.email ? fields.email.stringValue : "",
          role: fields.role ? fields.role.stringValue : "admin",
          active: fields.active ? fields.active.booleanValue : true,
          createdAt: fields.createdAt ? fields.createdAt.stringValue : null,
        };
      });
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  },

  // Update user
  async updateUser(userId, updates) {
    try {
      const fields = {};

      if (updates.password) {
        fields.passwordHash = {
          stringValue: await this.hashPassword(updates.password),
        };
      }
      if (updates.email !== undefined) {
        fields.email = { stringValue: updates.email };
      }
      if (updates.role !== undefined) {
        fields.role = { stringValue: updates.role };
      }
      if (updates.active !== undefined) {
        fields.active = { booleanValue: updates.active };
      }

      const url = `https://firestore.googleapis.com/v1/projects/${BACKEND_CONFIG.firebase.projectId}/databases/(default)/documents/users/${userId}`;

      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log("✅ User updated successfully");
      return true;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  },

  // Delete user
  async deleteUser(userId) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${BACKEND_CONFIG.firebase.projectId}/databases/(default)/documents/users/${userId}`;

      const response = await fetch(url, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      console.log("✅ User deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  },

  // Login function
  async login(username, password) {
    try {
      // Get user from Firebase
      const user = await this.getUserByUsername(username);

      if (!user) {
        console.log("❌ User not found");
        return false;
      }

      // Check if user is active
      if (!user.active) {
        console.log("❌ User account is deactivated");
        return false;
      }

      // Hash the entered password
      const hashedPassword = await this.hashPassword(password);

      // Compare with stored hash
      if (hashedPassword === user.passwordHash) {
        // Create session
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          loginTime: new Date().getTime(),
          token: this.generateToken(),
          projectId: BACKEND_CONFIG.firebase.projectId,
        };

        // Save to localStorage
        localStorage.setItem("adminSession", JSON.stringify(this.currentUser));

        console.log("✅ Login successful");
        return true;
      }

      console.log("❌ Invalid password");
      return false;
    } catch (error) {
      console.error("❌ Login error:", error);
      return false;
    }
  },

  // Logout function
  logout() {
    this.currentUser = null;
    localStorage.removeItem("adminSession");
    console.log("✅ Logged out");
  },

  // Check if user is authenticated
  isAuthenticated() {
    if (!this.currentUser) return false;

    // Check if session is still valid
    const now = new Date().getTime();
    if (now - this.currentUser.loginTime > this.sessionTimeout) {
      this.logout();
      return false;
    }

    // Verify project ID matches (prevents cross-database access)
    if (this.currentUser.projectId !== BACKEND_CONFIG.firebase.projectId) {
      this.logout();
      return false;
    }

    return true;
  },

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  },

  // Generate random token
  generateToken() {
    return (
      Math.random().toString(36).substring(2) +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2)
    );
  },

  // Check and refresh session
  refreshSession() {
    if (this.isAuthenticated()) {
      this.currentUser.loginTime = new Date().getTime();
      localStorage.setItem("adminSession", JSON.stringify(this.currentUser));
    }
  },
};

// Make available globally
if (typeof window !== "undefined") {
  window.FirebaseAuth = FirebaseAuth;
}
