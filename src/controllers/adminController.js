const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const {
  addCategory,
  deleteCategory,
  getCategories,
  updateCategory
} = require('../services/categoryService');

const VALID_ROLES = ['Community Member', 'Facility Manager', 'Worker', 'Admin'];

/**
 * GET /api/admin/users
 * Get all users with admin role
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /api/admin/users/:id/activate
 * Activate a user account
 */
exports.activateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent self-deactivation logic (allow re-activation)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json({ message: 'User activated', user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate a user account
 */
exports.deactivateUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent self-deactivation
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json({ message: 'User deactivated', user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /api/admin/users/:id/promote
 * Change user role (promote/demote)
 */
exports.promoteUserRole = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const { role } = req.body;

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    const cleanRole = String(role).trim();

    if (!VALID_ROLES.includes(cleanRole)) {
      return res.status(400).json({
        error: 'Invalid role',
        allowedRoles: VALID_ROLES
      });
    }

    // Prevent self-role-change
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role: cleanRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json({ message: `User role changed to ${cleanRole}`, user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /api/admin/users/:id/verify
 * Mark user as verified (email verified)
 */
exports.verifyUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true,
        actsOfServicePoints: true
      }
    });

    res.json({ message: 'User verified', user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * DELETE /api/admin/users/:id
 * Delete a user (admin only, irreversible)
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Prevent self-deletion
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const deleted = await prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true
      }
    });

    res.json({ message: 'User deleted', user: deleted });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

/**
 * PUT /api/admin/users/:id/reset-password
 * Reset a user's password (admin only)
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        isVerified: true
      }
    });

    res.json({ message: 'Password reset', user: updated });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      usersByRole,
      totalIssues,
      issuesByStatus
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isVerified: true } }),
      prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
      prisma.issue.count(),
      prisma.issue.groupBy({ by: ['status'], _count: { _all: true } })
    ]);

    res.json({
      summary: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        verifiedUsers,
        unverifiedUsers: totalUsers - verifiedUsers,
        totalIssues
      },
      usersByRole: usersByRole.map((item) => ({
        role: item.role,
        count: item._count._all
      })),
      issuesByStatus: issuesByStatus.map((item) => ({
        status: item.status,
        count: item._count._all
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await getCategories();
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const categories = await addCategory(req.body?.name);
    res.status(201).json({ message: 'Category created', categories });
  } catch (error) {
    const status = error.message === 'Category already exists' || error.message === 'Category name is required' ? 400 : 500;
    res.status(status).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const categories = await updateCategory(req.params.name, req.body?.name);
    res.json({ message: 'Category updated', categories });
  } catch (error) {
    const status = ['Current and next category names are required', 'Category already exists'].includes(error.message)
      ? 400
      : error.message === 'Category not found'
        ? 404
        : 500;

    res.status(status).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const categories = await deleteCategory(req.params.name);
    res.json({ message: 'Category deleted', categories });
  } catch (error) {
    const status = error.message === 'Category not found' ? 404 : error.message === 'Category name is required' ? 400 : 500;
    res.status(status).json({ error: error.message, code: 'SERVER_ERROR' });
  }
};
