import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slugify.js';

export const listCategories = () => Category.find().sort({ name: 1 });

export const createCategory = ({ name, description }) =>
  Category.create({ name, description, slug: slugify(name) });

export const updateCategory = async (id, data) => {
  const category = await Category.findById(id);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }

  if (data.name && data.name !== category.name) {
    category.slug = slugify(data.name);
  }

  Object.assign(category, data);
  return category.save();
};

export const deleteCategory = async (id) => {
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw ApiError.conflict(`Category still has ${productCount} product(s). Move or remove them first.`);
  }

  const deleted = await Category.findByIdAndDelete(id);
  if (!deleted) {
    throw ApiError.notFound('Category not found');
  }
  return deleted;
};
