export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_JSON",
        message: "Request body contains invalid JSON",
      },
    });
  }

  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      error: {
        code: "DUPLICATE_EMAIL",
        message: "An account with this email already exists",
      },
    });
  }

  if (err?.name === "CastError" && err?.path === "_id") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "Invalid user ID format",
      },
    });
  }

  if (err?.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "DATABASE_VALIDATION_ERROR",
        message: "User data failed validation",
      },
    });
  }

  console.error(err);

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction
        ? "An unexpected error occurred"
        : err.message || "An unexpected error occurred",
    },
  });
}
