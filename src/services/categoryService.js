const fs = require('fs/promises');
const path = require('path');

const DEFAULT_CATEGORIES = [
  'Plumbing',
  'Electrical',
  'HVAC',
  'Cleaning',
  'Cleanliness',
  'Maintenance',
  'Infrastructure',
  'Sustainability',
  'Other'
];

const dataDir = path.join(__dirname, '..', '..', 'data');
const categoriesFile = path.join(dataDir, 'categories.json');

const ensureStore = async () => {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(categoriesFile);
  } catch {
    await fs.writeFile(
      categoriesFile,
      JSON.stringify({ categories: DEFAULT_CATEGORIES }, null, 2),
      'utf8'
    );
  }
};

const normalizeCategory = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const readCategories = async () => {
  await ensureStore();
  const raw = await fs.readFile(categoriesFile, 'utf8');
  const parsed = JSON.parse(raw);
  const categories = Array.isArray(parsed.categories) ? parsed.categories : DEFAULT_CATEGORIES;

  return categories
    .map(normalizeCategory)
    .filter(Boolean);
};

const writeCategories = async (categories) => {
  const uniqueCategories = Array.from(new Set(categories.map(normalizeCategory).filter(Boolean)));
  await ensureStore();
  await fs.writeFile(
    categoriesFile,
    JSON.stringify({ categories: uniqueCategories }, null, 2),
    'utf8'
  );
  return uniqueCategories;
};

const getCategories = async () => readCategories();

const addCategory = async (category) => {
  const cleanCategory = normalizeCategory(category);

  if (!cleanCategory) {
    throw new Error('Category name is required');
  }

  const categories = await readCategories();
  const exists = categories.some((item) => item.toLowerCase() === cleanCategory.toLowerCase());

  if (exists) {
    throw new Error('Category already exists');
  }

  return writeCategories([...categories, cleanCategory]);
};

const updateCategory = async (currentName, nextName) => {
  const cleanCurrent = normalizeCategory(currentName);
  const cleanNext = normalizeCategory(nextName);

  if (!cleanCurrent || !cleanNext) {
    throw new Error('Current and next category names are required');
  }

  const categories = await readCategories();
  const currentIndex = categories.findIndex((item) => item.toLowerCase() === cleanCurrent.toLowerCase());

  if (currentIndex === -1) {
    throw new Error('Category not found');
  }

  const duplicateIndex = categories.findIndex((item) => item.toLowerCase() === cleanNext.toLowerCase());
  if (duplicateIndex !== -1 && duplicateIndex !== currentIndex) {
    throw new Error('Category already exists');
  }

  categories[currentIndex] = cleanNext;
  return writeCategories(categories);
};

const deleteCategory = async (category) => {
  const cleanCategory = normalizeCategory(category);

  if (!cleanCategory) {
    throw new Error('Category name is required');
  }

  const categories = await readCategories();
  const remaining = categories.filter((item) => item.toLowerCase() !== cleanCategory.toLowerCase());

  if (remaining.length === categories.length) {
    throw new Error('Category not found');
  }

  return writeCategories(remaining);
};

module.exports = {
  DEFAULT_CATEGORIES,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory
};
