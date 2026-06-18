const errorHandler = (err, req, res, next) => {
  // 1. Log the full error stack to the server terminal console for developers
  console.error('SERVER ERROR LOG:', err);

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
