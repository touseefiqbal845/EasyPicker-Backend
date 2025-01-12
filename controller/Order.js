const mongoose = require("mongoose");
const { Order } = require("../model/Order");
const { Product } = require("../model/Product");
const { User } = require("../model/User");
const { invoiceTemplate, sendMail } = require("../services/common");

exports.createOrder = async (req, res) => {
  const order = new Order(req.body);

  for (let item of order.items) {
    let product = await Product.findOne({ _id: item.product.id });
    product.$inc("stock", -1 * item.quantity);
    await product.save();
  }

  try {
    const doc = await order.save();
    const userEmail = await User.findById(order.user);
    console.log("userEmail", userEmail);
    sendMail({
      to: userEmail.email,
      html: invoiceTemplate(order),
      subject: "Order Received",
    });

    res.status(201).json(doc);
  } catch (err) {
    res.status(400).json(err);
  }
};

exports.deleteOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByIdAndDelete(id);
    res.status(200).json(order);
  } catch (err) {
    res.status(400).json(err);
  }
};
exports.updateOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const updateOrder = await Order.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.status(200).json(updateOrder);
  } catch (err) {
    res.status(400).json({ err });
  }
};
exports.fetchOrdersByUser = async (req, res) => {
  const { id } = req.user;
  console.log({ id });

  try {
    const orders = await Order.find({ user: id });
    console.log(orders);

    res.status(200).json(orders);
  } catch (err) {
    res.status(400).json(err);
  }
};
exports.fetchAllOrders = async (req, res) => {
  // sort = {_sort:"price",_order="desc"}
  // pagination = {_page:1,_limit=10}
  let query = Order.find({ deleted: { $ne: true } });
  let totalOrdersQuery = Order.find({ deleted: { $ne: true } });

  if (req.query._sort && req.query._order) {
    query = query.sort({ [req.query._sort]: req.query._order });
  }

  const totalDocs = await totalOrdersQuery.count().exec();
  console.log({ totalDocs });

  if (req.query._page && req.query._limit) {
    const pageSize = req.query._limit;
    const page = req.query._page;
    query = query.skip(pageSize * (page - 1)).limit(pageSize);
  }

  try {
    const docs = await query.exec();
    res.set("X-Total-Count", totalDocs);
    res.status(200).json(docs);
  } catch (err) {
    res.status(400).json(err);
  }
};
