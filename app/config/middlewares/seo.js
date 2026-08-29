module.exports = (req, res, next) => {
  res.locals.seo = {
    title: app.config.common.SEO_DEFAULT_TITLE,
    description: app.config.common.SEO_DEFAULT_DESCRIPTION,
    image: app.config.common.SEO_DEFAULT_IMAGE,
    url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
    noindex: app.config.common.SEO_NOINDEX
  };

  next();
};
