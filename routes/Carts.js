const express = require('express');
const { fetchCartByUser, addtoCart, updateCart, deletefromCart } = require('../controller/Cart');

const router = express.Router();

router.get('/',fetchCartByUser)
      .post('/',addtoCart)
      .patch('/:id',updateCart)
      .delete('/:id',deletefromCart);

exports.router = router;
