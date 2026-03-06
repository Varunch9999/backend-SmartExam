const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "devsecret";


const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.split(" ")[1];
  if (!token) return next();

  try {
    const payload = jwt.verify(token, JWT_SECRET);

    req.user = {
      _id: payload.id,
      role: payload.role,
      name: payload.name
    };
  } catch (err) {
   
    req.user = null;
  }

  next();
};


const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
};


const allowRoles = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
};

module.exports = { auth, requireAuth, allowRoles };
