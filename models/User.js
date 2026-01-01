let mongoose = require("mongoose");
let constants = require("../utils/constants");

let UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    sex: { type: String, required: true, enum: constants.SEX },

    department: { type: String, required: true, enum: constants.DEPARTMENTS },

    profileImage: {
      url: { type: String,
         default: "" 
        },
      publicId: { type: String, default: "" },
    },

    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
