const Offer = require("../../models/offerSchema");
const Category = require("../../models/categorySchema");

// ===============================================CategoryOffers-GET===================================================================//
exports.getCategoryOffers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const search = req.query.search || "";

    const searchFilter = {
      categoryName: { $regex: search, $options: "i" },
    };

    const totalOffers = await Offer.countDocuments(searchFilter);

    const totalPages = Math.ceil(totalOffers / limit);

    const offers = await Offer.find(searchFilter)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: 1 });


    res.render("offers", { offers, currentPage: page, totalPages, search });
  } catch (error) {
    next(error);
  }
};

// ===============================================Add Categoryffer - GET===================================================================//

exports.getAddCategoryOffer = async (req, res, next) => {
  try {
    const categories = await Category.find({ isListed: true });
    return res.render("add-offer", { categories });
  } catch (error) {
    next(error);
  }
};

// ===============================================Add Category Offer-POST===================================================================//
exports.postAddCategoryOffer = async (req, res, next) => {
  try {
    const { categoryId, categoryDiscount, validFrom, validTo } = req.body;


    // Validate date range
    const validFromDate = new Date(validFrom);
    const validToDate = new Date(validTo);
    if (validToDate < validFromDate) {
      return res.status(400).json({ success: false, message: "Valid to date cannot be before valid from date" });
    }

    // Fetch category details using categoryId
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }


    const newOffer = new Offer({
      categoryId,
      categoryName: category.name, 
      categoryDiscount:categoryDiscount || 0,
      validFrom: validFromDate,
      validTo: validToDate,
    });

    await newOffer.save();

    return res.status(200).json({ success: true, message: "Category offer added successfully" });
  } catch (error) {
    next(error);
  }
};


// ===============================================Edit Category Offer-GET===================================================================//

exports.getEditCategoryOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const offer = await Offer.findById(offerId);
    if (!offer) {
      return res.status(404).json({success:false,message:"Category Offer not found."})
    }

    const categories = await Category.find({ isListed: true });

    res.render("edit-offer", { categories, offer });
  } catch (error) {
    next(error);
  }
};

// ===============================================Edit Category Offer-PUT===================================================================//
exports.putEditCategoryOffer = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    const { categoryId, categoryDiscount, validFrom, validTo } = req.body;

    // Validate date range
    const validFromDate = new Date(validFrom);
    const validToDate = new Date(validTo);
    if (validToDate < validFromDate) {
      return res.status(400).json({ success: false, message: "Valid to date cannot be before valid from date" });
    }

    // Fetch category details using categoryId
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    // Update the offer
    const updatedOffer = await Offer.findByIdAndUpdate(
      offerId,
      {
        categoryId,
        categoryName: category.name,
        categoryDiscount,
        validFrom: validFromDate,
        validTo: validToDate,
      },
      { new: true }
    );

    return res.status(200).json({ success: true, message: "Category offer updated successfully" });
  } catch (error) {
    next(error);
  }
};

// ===============================================Update Category Offer Status-PATCH===================================================================//

exports.patchUpdateOfferStatus = async (req, res, next) => {
  try {
    const offerId = req.params.id;
    
    const offer = await Offer.findById(offerId);
    
    if (!offer) {
      return res.status(404).json({ success: false,message: 'Offer not found'});
    }
    
    offer.isActive = !offer.isActive;
    await offer.save();

    const message = offer.isActive ? "Offer activated Successfully" : "Offer deactivated successfully"
    
    return res.status(200).json({success: true,isActive: offer.isActive, message});
  }
  catch (error) {
    next(error);
  }
};