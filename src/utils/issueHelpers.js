const ALLOWED_STATUSES = [
  'Submitted/Pending',
  'Assigned',
  'In Progress',
  'Under Review',
  'Resolved',
  'Rejected'
];

const LEGACY_STATUSES = ['Open'];

const STATUS_TRANSITIONS = {
  'Submitted/Pending': ['Assigned', 'In Progress', 'Rejected'],
  'Assigned': ['In Progress', 'Rejected'],
  'In Progress': ['Under Review', 'Rejected'],
  'Under Review': ['Resolved', 'Rejected', 'In Progress'],
  'Resolved': [],
  'Rejected': []
};

const sanitizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim();
};

const normalizeLocation = (value) => {
  return sanitizeText(value).replace(/\s+/g, ' ');
};

const normalizeStatus = (value) => {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const isAllowedStatus = (status) => {
  return ALLOWED_STATUSES.includes(status);
};

const isLegacyStatus = (status) => {
  return LEGACY_STATUSES.includes(status);
};

const isValidStatusTransition = (currentStatus, nextStatus) => {
  if (!currentStatus || !nextStatus) {
    return false;
  }

  if (currentStatus === nextStatus) {
    return true;
  }

  const normalizedCurrent = isLegacyStatus(currentStatus)
    ? 'Submitted/Pending'
    : currentStatus;

  const allowedNext = STATUS_TRANSITIONS[normalizedCurrent] || [];
  return allowedNext.includes(nextStatus);
};

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

module.exports = {
  ALLOWED_STATUSES,
  isAllowedStatus,
  isLegacyStatus,
  isValidStatusTransition,
  normalizeLocation,
  normalizeStatus,
  parsePositiveInt,
  sanitizeText
};

