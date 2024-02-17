const express = require('express');
const { fetchAllOrders, createOrder, updateOrder, fetchOrdersByUser } = require('../controller/Order');

const router = express.Router();

router.get('/',fetchAllOrders)
      .get('/',fetchOrdersByUser)
      .post('/',createOrder)
      .patch('/:id',updateOrder)
      

exports.router = router
