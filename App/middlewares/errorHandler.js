const errorHandler = (err, req, res, next) => {
  // 1. Log the full error stack to the server terminal console for developers
  console.error('SERVER ERROR LOG:', err);

  /*
    NOTE FOR THE FUTURE:
    Why do we check 'wantsHtml' (Accept header) and 'content-type' here?
    Because in this project, our page routes (e.g. '/cart') and API fetch routes (e.g. '/update-cart') 
    are mixed at the root level. We must check headers to know if the client expects a JSON or HTML response.
    
    ALTERNATIVE APPROACH (If routes were separated by prefix):
    If all API endpoints started with '/api' (e.g. '/api/cart/update'), we could simply write:
    
    if (req.originalUrl.startsWith('/api')) {
      return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
    if (req.originalUrl.startsWith('/admin')) {
      return res.status(500).render('error-500');
    }
    return res.status(500).render('page-500');
  */

  // 2. Check if the browser wants HTML (Full Page Load)
  const wantsHtml = req.headers.accept && req.headers.accept.includes('text/html');

  // 3. Detect if it is an API / Fetch request
  const isApiRequest = 
    !wantsHtml || // If the browser does NOT expect HTML, it is a fetch/AJAX call
    (req.headers['content-type'] && req.headers['content-type'].includes('application/json')); // Or if the request contains JSON data

  // 4. If it is an API request, return a clean JSON response
  if (isApiRequest) {
    return res.status(500).json({
      success: false,
      message: 'Internal Server Error. Please try again later.'
    });
  }

  // 5. If it is a full page load in the Admin panel, show the Admin 500 error page
  if (req.originalUrl.startsWith('/admin')) {
    return res.status(500).render('error-500');
  }

  // 6. Otherwise, show the User storefront 500 error page
  return res.status(500).render('page-500');
};

module.exports = errorHandler;
