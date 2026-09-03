module.exports = {
  get(req, res) {
    res.locals.seo = {
      ...res.locals.seo,
      title: 'Vulkano App — CMS'
    };

    res.render('cms/index.html');
  }
};
