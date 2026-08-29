module.exports = {
  get(req, res) {
    res.locals.seo = {
      ...res.locals.seo,
      title: 'Vulkano App — Home'
    };

    res.render('home/index.html');
  }
};
