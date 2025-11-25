const User = require("../models/User"); // or your User model

async function isUser(req, res, next) {
  try {
    // authMiddleware already decoded token and set req.user
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch real user from database
    const realUser = await User.findById(req.user.id).select("role");

    if (!realUser) {
      return res.status(404).json({ error: "User not found" });
    }

    if (realUser.role !== "user") {
      return res.status(403).json({ error: "Only users can search for workers." });
    }

    // Attach verified data
    req.realUser = realUser;

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
module.exports = isUser;