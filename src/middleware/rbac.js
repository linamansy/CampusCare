/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role-based authorization for protected routes
 */

const { verifyAuth } = require('./auth');
const prisma = require('../prismaClient');

/**
 * Middleware that requires user to have one of specified roles
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {Function} Express middleware
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return async (req, res, next) => {
    try {
      // First verify auth
      verifyAuth(req, res, async () => {
        try {
          const user = await prisma.user.findUnique({
            where: { id: req.userId },
            select: { id: true, role: true, isActive: true }
          });

          if (!user) {
            return res.status(401).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
          }

          if (!user.isActive) {
            return res.status(403).json({ error: 'User account is inactive', code: 'ACCOUNT_INACTIVE' });
          }

          if (!roles.includes(user.role)) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              code: 'FORBIDDEN',
              requiredRoles: roles,
              userRole: user.role
            });
          }

          req.user = user;
          next();
        } catch (error) {
          res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
    }
  };
};

/**
 * Shorthand middleware for admin-only routes
 */
const requireAdmin = () => requireRole('Admin');

/**
 * Shorthand middleware for facility manager-only routes
 */
const requireManager = () => requireRole('Facility Manager');

/**
 * Shorthand middleware for worker-only routes
 */
const requireWorker = () => requireRole('Worker');

/**
 * Shorthand middleware for community member routes
 */
const requireMember = () => requireRole('Community Member');

/**
 * Middleware for manager OR admin (for manager dashboard accessible to both)
 */
const requireManagerOrAdmin = () => requireRole(['Facility Manager', 'Admin']);

module.exports = {
  requireRole,
  requireAdmin,
  requireManager,
  requireWorker,
  requireMember,
  requireManagerOrAdmin
};
