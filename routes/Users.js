const express = require("express");
const {
  fetchUsers,
  updateUser,
  fetchUserById,
} = require("../controller/User");

const router = express.Router();

router
  .get("/", fetchUsers)
  .get("/own", fetchUserById)
  .patch("/:id", updateUser);

exports.router = router;
