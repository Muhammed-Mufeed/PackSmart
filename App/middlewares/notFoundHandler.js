const notFoundHandler = (req, res, next) => {
  res.status(404);

  // 1. Check if the browser wants HTML (Full Page Load)
  const wantsHtml = req.headers.accept && req.headers.accept.includes('text/html');

  // 2. If it does NOT want HTML, it's a fetch/AJAX background call - return JSON
  if (!wantsHtml) {
    return res.json({
      success: false,
      message: 'Resource Not Found'
    });
  }

  // 3. If it is a full page load in the Admin panel, render views/admin/error-404.ejs
  if (req.originalUrl.startsWith('/admin')) {
    return res.render('error-404');
  }

  // 4. Otherwise, render views/user/page-404.ejs for standard users
  return res.render('page-404');
};

module.exports = notFoundHandler;
