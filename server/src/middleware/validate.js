// Validates request parts with Zod. Parsed (typed, defaulted, unknown-keys-stripped) values replace the originals.
// Usage: router.get('/x', validate({ params, query, body }), controller)
export const validate = (schemas) => (req, _res, next) => {
  try {
    for (const part of ['params', 'query', 'body']) {
      if (schemas[part]) req[part] = schemas[part].parse(req[part] ?? {});
    }
    next();
  } catch (err) {
    next(err); // ZodError is converted by the central error handler
  }
};
