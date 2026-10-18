
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";

const SALT_ROUNDS = 12;

function userResponse(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validateId(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid user ID format",
      },
    });

    return false;
  }

  return true;
}

export async function createUser(req, res) {
  const { name, email, password } = req.validatedBody;

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  return res.status(201).json({
    success: true,
    data: {
      user: userResponse(user),
    },
  });
}

export async function getUserById(req, res) {
  if (!validateId(req, res)) return;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
      },
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      user: userResponse(user),
    },
  });
}

// PUT replaces all editable fields.
// Required fields: name, email, password.
export async function replaceUser(req, res) {
  if (!validateId(req, res)) return;

  const { name, email, password } = req.validatedBody;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
      },
    });
  }

  user.name = name;
  user.email = email;
  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  await user.save();

  return res.status(200).json({
    success: true,
    data: {
      user: userResponse(user),
    },
  });
}

// PATCH updates only the supplied editable fields.
export async function patchUser(req, res) {
  if (!validateId(req, res)) return;

  const updates = { ...req.validatedBody };

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      error: {
        code: "USER_NOT_FOUND",
        message: "User not found",
      },
    });
  }

  if (updates.name !== undefined) {
    user.name = updates.name;
  }

  if (updates.email !== undefined) {
    user.email = updates.email;
  }

  if (updates.password !== undefined) {
    user.passwordHash = await bcrypt.hash(
      updates.password,
      SALT_ROUNDS
    );
  }

  await user.save();

  return res.status(200).json({
    success: true,
    data: {
      user: userResponse(user),
    },
  });
}

export async function listUsers(req, res) {
  const { page, limit } = req.validatedQuery;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(),
  ]);

  return res.status(200).json({
    success: true,
    data: {
      users: users.map(userResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
}
