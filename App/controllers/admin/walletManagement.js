const Wallet = require('../../models/WalletSchema');
const User = require('../../models/userSchema');

exports.getWalletTransactionsPage = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const search = req.query.search || '';

    let searchFilter = {};
    
    if (search) {
      const matchingUsers = await User.find({
        email: { $regex: search, $options: 'i' }
      }).select('_id');
      const userIds = matchingUsers.map(user => user._id);

      searchFilter = {
        $or: [
          { user: { $in: userIds } },
          { 'transactions.transactionId': { $regex: search, $options: 'i' } }
        ]
      };
    }

    const wallets = await Wallet.find(searchFilter)
      .populate('user', 'email')
      

    let allTransactions = [];

    wallets.forEach(wallet => {
      wallet.transactions.forEach(transaction => {
        allTransactions.push({
          transactionId: transaction.transactionId,
          type: transaction.type,
          amount: transaction.amount,
          date: transaction.date,
          user: wallet.user,  
        });
      });
    });

    // Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalTransactions = allTransactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = allTransactions.slice(startIndex, endIndex);

    return res.render('wallet', {
      transactions: paginatedTransactions,
      currentPage: page,
      totalPages,
      search,
    });
  } catch (error) {
    next(error);
  }
};


exports.getTransactionDetails = async (req, res, next) => {
  try {
    const transactionId = req.params.id; 

    const wallet = await Wallet.findOne({ 'transactions.transactionId': transactionId })
      .populate('user', 'email');
    
    if (!wallet) {
      return res.status(404).render('error-404');
    }

    // Find the specific transaction by transactionId
    const transaction = wallet.transactions.find(t => t.transactionId === transactionId);
    if (!transaction) {
      return res.status(404).render('error-404');
    }

    res.render('transactionDetails', {
      transaction,
      user: wallet.user
    });
  } catch (error) {
    next(error);
  }
};