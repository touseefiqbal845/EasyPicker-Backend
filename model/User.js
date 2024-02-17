const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: Buffer, required: true },
    role: { type: String, required: true, default: "user" },
    addresses: { type: [mongoose.Schema.Types.Mixed] },
    name: { type: String },
    orders: { type: [mongoose.Schema.Types.Mixed] },
    resetPasswordToken: { type: String, default: "" },
    salt: Buffer,
  },
  { timestamps: true }
);

const virtualId = userSchema.virtual("id");
virtualId.get(function () {
  return this._id;
});

userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

exports.User = mongoose.model("User", userSchema);
