const {
  allowedFilterFields,
  getAllIssues,
  getFilteredIssues,
  searchIssues
} = require('../services/managerIssueService');

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;

exports.getManagerIssues = async (req, res) => {
  try {
    const issues = await getAllIssues();
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.filterManagerIssues = async (req, res) => {
  const filters = {};
  const invalidFilters = Object.keys(req.query).filter((key) => !allowedFilterFields.includes(key));

  if (invalidFilters.length > 0) {
    return res.status(400).json({
      error: `Invalid filter(s): ${invalidFilters.join(', ')}. Use status, category, or location.`
    });
  }

  for (const field of allowedFilterFields) {
    if (req.query[field] != null) {
      if (!hasValue(req.query[field])) {
        return res.status(400).json({ error: `${field} filter cannot be empty` });
      }

      filters[field] = req.query[field].trim();
    }
  }

  if (Object.keys(filters).length === 0) {
    return res.status(400).json({
      error: 'At least one filter is required: status, category, or location'
    });
  }

  try {
    const issues = await getFilteredIssues(filters);
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchManagerIssues = async (req, res) => {
  const query = req.query.q;

  if (!hasValue(query)) {
    return res.status(400).json({ error: 'Search query q is required' });
  }

  try {
    const issues = await searchIssues(query.trim());
    res.json(issues);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
