/** validate(zodSchema, 'body' | 'query') -> replaces the input with the parsed, stripped value. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error);
  if (source === 'query') {
    // req.query is a getter in some setups; store parsed copy separately
    req.validatedQuery = result.data;
  } else {
    req[source] = result.data;
  }
  next();
};
