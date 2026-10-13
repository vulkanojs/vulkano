module.exports = {
  get(req, res) {
    res.locals.seo = {
      ...res.locals.seo,
      title: 'VulkanoJS - Admin'
    };

    res.render('admin/index.html');
  }
};
