module.exports = {
  get(req, res) {
    res.locals.seo = {
      ...res.locals.seo,
      title: 'Vulkano App — Admin'
    };

    res.render('admin/index.html');
  }
};
