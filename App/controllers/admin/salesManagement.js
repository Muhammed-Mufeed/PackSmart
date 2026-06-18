const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');




exports.getSalesDashboard = async (req, res, next) => {
    try {
        const { filter = 'monthly', startDate, endDate } = req.query;

        let dateFilter = {};
        const today = new Date();
        if (filter === 'today') {
            dateFilter = { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) } };
        } else if (filter === 'weekly') {
            dateFilter = { createdAt: { $gte: new Date(today.setDate(today.getDate() - 7)) } };
        } else if (filter === 'monthly') {
            dateFilter = { createdAt: { $gte: new Date(today.setMonth(today.getMonth() - 1)) } };
        } else if (filter === 'yearly') {
            dateFilter = { createdAt: { $gte: new Date(today.setFullYear(today.getFullYear() - 1)) } };
        } else if (filter === 'custom' && startDate && endDate) {
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        }

        const orders = await Order.find(dateFilter)
            .populate('user')
            .sort({ createdAt: -1 })
            .limit(5);

        const allOrders = await Order.find(dateFilter);
        const totalOrders = allOrders.length;
        const totalRevenue = allOrders.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalDiscount = allOrders.reduce((sum, order) => sum + (order.items.reduce((itemSum, item) => {
            const discount = (item.product.actualPrice - item.product.soldPrice) * item.quantity;
            return itemSum + discount;
        }, 0)), 0);
        const totalCoupon = allOrders.reduce((sum, order) => sum + (order.coupon.discountAmount || 0), 0);
        const totalPreDiscount = totalRevenue + totalDiscount + totalCoupon;
        const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        const salesData = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    revenue: { $sum: '$finalAmount' },
                    totalAmount: { $sum: { $add: ['$finalAmount', '$coupon.discountAmount'] } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const topCategories = await Order.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    count: { $sum: '$items.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const topCategoriesData = topCategories.map(cat => ({
            name: cat.category.name,
            count: cat.count
        }));

        res.render('dashboard', {
            filter,
            startDate: startDate || '',
            endDate: endDate || '',
            totalRevenue,
            totalOrders,
            averageOrder,
            totalDiscount,
            totalCoupon,
            totalPreDiscount,
            orders,
            salesData,
            topCategoriesData
        });
    } catch (error) {
        next(error);
    }
};

exports.getChartData = async (req, res, next) => {
    try {
        const { filter = 'monthly', startDate, endDate } = req.query;

        let dateFilter = {};
        const today = new Date();
        if (filter === 'today') {
            dateFilter = { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) } };
        } else if (filter === 'weekly') {
            dateFilter = { createdAt: { $gte: new Date(today.setDate(today.getDate() - 7)) } };
        } else if (filter === 'monthly') {
            dateFilter = { createdAt: { $gte: new Date(today.setMonth(today.getMonth() - 1)) } };
        } else if (filter === 'yearly') {
            dateFilter = { createdAt: { $gte: new Date(today.setFullYear(today.getFullYear() - 1)) } };
        } else if (filter === 'custom' && startDate && endDate) {
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        }

        let dateFormat;
        if (filter === 'today') {
            dateFormat = '%Y-%m-%d %H:00';
        } else if (filter === 'weekly') {
            dateFormat = '%Y-%m-%d';
        } else if (filter === 'monthly') {
            dateFormat = '%Y-%m-%d';
        } else if (filter === 'yearly') {
            dateFormat = '%Y-%m';
        } else if (filter === 'custom') {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const diffDays = (end - start) / (1000 * 60 * 60 * 24);
            if (diffDays <= 1) {
                dateFormat = '%Y-%m-%d %H:00';
            } else if (diffDays <= 31) {
                dateFormat = '%Y-%m-%d';
            } else {
                dateFormat = '%Y-%m';
            }
        }

        const salesData = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: dateFormat, date: '$createdAt' } },
                    revenue: { $sum: '$finalAmount' },
                    totalAmount: { $sum: { $add: ['$finalAmount', '$coupon.discountAmount'] } },
                    orders: { $sum: 1 }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        const topCategories = await Order.aggregate([
            { $match: dateFilter },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $group: {
                    _id: '$product.category',
                    count: { $sum: '$items.quantity' }
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: '$category' },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);

        const topCategoriesData = topCategories.map(cat => ({
            name: cat.category.name,
            count: cat.count
        }));

        res.json({
            salesData,
            topCategoriesData
        });
    } catch (error) {
        next(error);
    }
};

exports.downloadSalesReport = async (req, res, next) => {
    try {
        const { type, filter, startDate, endDate } = req.query;

        // Set date range for report
        let dateFilter = {};
        const today = new Date();
        if (filter === 'today') {
            dateFilter = { createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) } };
        } else if (filter === 'weekly') {
            dateFilter = { createdAt: { $gte: new Date(today.setDate(today.getDate() - 7)) } };
        } else if (filter === 'monthly') {
            dateFilter = { createdAt: { $gte: new Date(today.setMonth(today.getMonth() - 1)) } };
        } else if (filter === 'yearly') {
            dateFilter = { createdAt: { $gte: new Date(today.setFullYear(today.getFullYear() - 1)) } };
        } else if (filter === 'custom' && startDate && endDate) {
            dateFilter = { createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) } };
        }

        // Fetch all orders within the date range
        const allOrders = await Order.find(dateFilter);

        // Calculate summary statistics
        const totalSalesPrice = allOrders.reduce((sum, order) => sum + order.finalAmount, 0);
        const totalOrders = allOrders.length;
        const totalUnitsSold = allOrders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        const totalDiscountAmount = allOrders.reduce((sum, order) => sum + (order.items.reduce((itemSum, item) => {
            const discount = (item.product.actualPrice - item.product.soldPrice) * item.quantity;
            return itemSum + discount;
        }, 0)), 0);
        const totalCancelOrders = allOrders.filter(order => order.items.some(item => item.status === 'Cancelled')).length;
        const totalCancelOrdersAmount = allOrders
            .filter(order => order.items.some(item => item.status === 'Cancelled'))
            .reduce((sum, order) => sum + order.finalAmount, 0);

        // Aggregate sales data by day
        const dailySalesData = await Order.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    totalSalesRevenue: { $sum: '$finalAmount' },
                    numberOfOrders: { $sum: 1 },
                    totalItemsSold: { $sum: { $sum: '$items.quantity' } }
                }
            },
            { $sort: { '_id': 1 } }
        ]);

        // Format the date range for the report title
        const start = startDate || today.toISOString().split('T')[0];
        const end = endDate || today.toISOString().split('T')[0];
        const reportTitle = `Sales Report (${start} - ${end}) - Sorted by ALL`;

        if (type === 'pdf') {
            const doc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');
            doc.pipe(res);

            // Header
            doc.fontSize(10).text('website: www.packSmart.com', { align: 'left' });
            doc.moveDown();
            doc.fontSize(16).text(reportTitle, { align: 'center' });
            doc.moveDown(2);

            // Summary Table
            doc.fontSize(12).text('Summary', { underline: true });
            doc.moveDown(0.5);

            const summaryTable = [
                ['Total Sales Price', totalSalesPrice.toFixed(2)],
                ['Total Orders', totalOrders],
                ['Total Units Sold', totalUnitsSold],
                ['Total Discount Amount', totalDiscountAmount.toFixed(2)],
                ['Total Cancel Orders', totalCancelOrders],
                ['Total Cancel Orders Amount', totalCancelOrdersAmount.toFixed(2)]
            ];

            let y = doc.y;
            summaryTable.forEach(([label, value]) => {
                doc.fontSize(10)
                    .text(label, 50, y, { width: 200, align: 'left' })
                    .text(value, 250, y, { width: 200, align: 'right' });
                y += 20;
            });

            doc.moveDown(2);

            // Detailed Table
            doc.fontSize(12).text('Daily Sales Breakdown', { underline: true });
            doc.moveDown(0.5);

            // Table Headers
            const headers = ['Date', 'Total Sales Revenue', 'Number of Orders', 'Total Items Sold'];
            const columnWidths = [100, 150, 150, 150];
            let x = 50;
            y = doc.y;

            doc.fontSize(10).font('Helvetica-Bold');
            headers.forEach((header, i) => {
                doc.text(header, x, y, { width: columnWidths[i], align: 'left' });
                x += columnWidths[i];
            });

            // Table Rows
            doc.font('Helvetica');
            y += 20;
            dailySalesData.forEach(row => {
                x = 50;
                doc.text(row._id, x, y, { width: columnWidths[0], align: 'left' });
                x += columnWidths[0];
                doc.text(row.totalSalesRevenue.toFixed(2), x, y, { width: columnWidths[1], align: 'left' });
                x += columnWidths[1];
                doc.text(row.numberOfOrders.toString(), x, y, { width: columnWidths[2], align: 'left' });
                x += columnWidths[2];
                doc.text(row.totalItemsSold.toString(), x, y, { width: columnWidths[3], align: 'left' });
                y += 20;
            });

            doc.end();
        } else if (type === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Sales Report');

            // Header
            worksheet.addRow(['website: www.packSmart.com']);
            worksheet.addRow([reportTitle]);
            worksheet.addRow([]); // Empty row for spacing

            // Summary Table
            worksheet.addRow(['Summary']);
            worksheet.addRow(['Total Sales Price', totalSalesPrice.toFixed(2)]);
            worksheet.addRow(['Total Orders', totalOrders]);
            worksheet.addRow(['Total Units Sold', totalUnitsSold]);
            worksheet.addRow(['Total Discount Amount', totalDiscountAmount.toFixed(2)]);
            worksheet.addRow(['Total Cancel Orders', totalCancelOrders]);
            worksheet.addRow(['Total Cancel Orders Amount', totalCancelOrdersAmount.toFixed(2)]);
            worksheet.addRow([]); // Empty row for spacing

            // Detailed Table
            worksheet.addRow(['Daily Sales Breakdown']);
            worksheet.addRow(['Date', 'Total Sales Revenue', 'Number of Orders', 'Total Items Sold']);

            // Add daily sales data
            dailySalesData.forEach(row => {
                worksheet.addRow([
                    row._id,
                    row.totalSalesRevenue.toFixed(2),
                    row.numberOfOrders,
                    row.totalItemsSold
                ]);
            });

            // Styling
            worksheet.getRow(1).font = { size: 10 };
            worksheet.getRow(2).font = { size: 16, bold: true };
            worksheet.getRow(4).font = { size: 12, bold: true, underline: true };
            worksheet.getRow(10).font = { size: 12, bold: true, underline: true };
            worksheet.getRow(11).font = { size: 10, bold: true };
            worksheet.getRow(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D3D3D3' } };

            worksheet.columns.forEach((column, i) => {
                column.width = i === 0 ? 15 : 20;
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=sales-report.xlsx');
            await workbook.xlsx.write(res);
            res.end();
        }
    } catch (error) {
        next(error);
    }
};