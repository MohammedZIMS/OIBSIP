export const toSkipLimit = ({ page, limit }) => ({ skip: (page - 1) * limit, limit });
export const pageMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});
