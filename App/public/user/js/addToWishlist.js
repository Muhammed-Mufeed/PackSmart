async function addToWishlist(productId, variantId){
  try {
    const response = await fetch('/addToWishlist',{
      method:'POST',
      headers: {
        'Content-Type':'application/json'
      },
      body:JSON.stringify({productId,variantId})
    });
    // Check if the response status is 401 (Unauthorized),(Not Logged in users)
    if(response.status === 401){
      window.location.href = "/login";
      return;
    }

    const data = await response.json();
    const wishlistIcon = document.querySelector(`.wishlist-icon[data-product = "${productId}"][data-variant="${variantId}"]`);

    if(data.success){
       if(data.action === 'added'){
          if (wishlistIcon) wishlistIcon.classList.add('active');
          if (window.notyf) {
            notyf.success(data.message || 'Product added to wishlist');
          } else if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon:'success',
              title:'Success',
              text: data.message || 'Product added to wishlist',
              confirmButtonText: "OK"
            });
          }
       }
       else if (data.action === 'removed'){
          if (wishlistIcon) wishlistIcon.classList.remove('active');
          if (window.notyf) {
            notyf.success(data.message || "Product removed from Wishlist");
          } else if (typeof Swal !== 'undefined') {
            Swal.fire({
              icon: 'success',
              title: 'Success',
              text: data.message || "Product removed from Wishlist",
              confirmButtonText: "OK"
            });
          }
       }
    }
    else {
      if (window.notyf) {
        notyf.error(data.message || "Failed to update Wishlist");
      } else if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: data.message || "Failed to update Wishlist",
            confirmButtonText: "OK"
        });
      }
    }
  } catch (error) {
    console.log("Error during wishlist operation", error);
    if (window.notyf) {
      notyf.error('An error occurred while updating Wishlist');
    } else if (typeof Swal !== 'undefined') {
      Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while updating Wishlist',
          confirmButtonText: 'OK'
      });
    }
  }
}

async function setWishlistInitialState() {
  try {
      const response = await fetch('/getWishlistItems', {
          method: 'GET',
          headers: {
              'Content-Type': 'application/json'
          }
      });
      
      const data = await response.json();
      if (data.success && data.items.length > 0) {
          const wishlistItems = data.items;
          const wishlistIcons = document.querySelectorAll('.wishlist-icon');

          wishlistIcons.forEach(icon => {
              const productId = icon.getAttribute('data-product');
              const variantId = icon.getAttribute('data-variant');
              const isInWishlist = wishlistItems.some(item => 
                  item.productId === productId && item.variantId === variantId
              );
              if (isInWishlist) {
                  icon.classList.add('active');
              } else {
                  icon.classList.remove('active');
              }
          });
      }
  } catch (error) {
      console.log("Error setting wishlist initial state:", error);
  }
}

// Run on page load - Ensures icons are updated as soon as the page is ready, without user interaction.
document.addEventListener('DOMContentLoaded', () => {
  setWishlistInitialState();
});