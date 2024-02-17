const mongoose = require("mongoose");
const { Cart } = require("../model/Cart");

exports.fetchCartByUser = async (req, res) => {
  const { id } = req.user;
  try {
    const items = await Cart.find({ user: id })
      .populate("product")
      .populate("user");
    res.status(200).json({ items });
  } catch (err) {
    res.status(400).json({ err });
  }
};

exports.addtoCart = async (req, res) => {
  const { id } = req.user;
  const cart = new Cart({ ...req.body, user: id });
  // const cart = new Cart(req.body );
  try {
    const addtoCart = await cart.save();
    const result = await addtoCart.populate("product");
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ err });
  }
};

exports.deletefromCart = async (req, res) => {
  const { id } = req.params;
  try {
    const doc = await Cart.findByIdAndDelete(id);
    res.status(200).json(doc);
  } catch (err) {
    res.status(400).json({ err });
  }
};

exports.updateCart = async (req, res) => {
  const { id } = req.params;
  try {
    // Ensure you are using the Cart model for findByIdAndUpdate
    const doc = await Cart.findByIdAndUpdate(id, req.body, { new: true });
    const result = await doc.populate("product");

    res.status(200).json(result);
  } catch (err) {
    res.status(400).json(err);
  }
};
