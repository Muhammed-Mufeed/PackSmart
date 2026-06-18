const notFoundHandler = (req, res, next) => {
  res.status(404);

  /*
    NOTE FOR THE FUTURE:
    Why do we check 'wantsHtml' (Accept header) here?
    Because in this project, our HTML page routes (e.g. '/cart') and AJAX fetch routes (e.g. '/update-cart') 
    are mixed together at the root level. The URL path alone doesn't tell us if it's a webpage load or a fetch call.
    
    ALTERNATIVE APPROACH (If routes were separated by prefix):
    If all API endpoints started with '/api' (e.g. '/api/cart/update'), we could simply write:
    
    if (req.originalUrl.startsWith('/api')) {
      return res.json({ success: false, message: 'Resource Not Found' });
    }
    return res.render('page-404');
  */

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
