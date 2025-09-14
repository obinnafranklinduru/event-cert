class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error("Error:", {
    message: err.message,
    stack: err.stack,
    name: err.name,
    statusCode: err.statusCode,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Ethers.js errors
  if (err.code === "CALL_EXCEPTION") {
    // Handle specific contract errors
    if (err.data === "0x09bde339") {
      // InvalidProof
      error = new AppError("Invalid merkle proof", 400);
    } else if (err.reason?.includes("AlreadyMinted")) {
      error = new AppError("Address has already minted a certificate", 400);
    } else if (err.reason?.includes("MintingNotActive")) {
      error = new AppError("Minting is not currently active", 400);
    } else if (err.reason?.includes("NotAuthorizedRelayer")) {
      error = new AppError("Relayer not authorized", 401);
    } else {
      error = new AppError("Blockchain transaction failed", 400);
    }
  }

  // Network errors
  if (err.code === "NETWORK_ERROR" || err.code === "TIMEOUT") {
    error = new AppError("Network connection issue. Please try again.", 503);
  }

  // Default to 500 server error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      details: err,
    }),
  });
};

module.exports = { errorHandler, AppError };
