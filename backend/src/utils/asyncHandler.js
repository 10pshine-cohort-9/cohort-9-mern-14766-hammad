// Express 5 forwards rejected promises on its own, but being explicit here
// keeps the controllers free of try/catch.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
