import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { ConflictError } from "../errors/ConflictError";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(err);
  if (err instanceof ConflictError) {
  res.status(409).json({
    success: false,
    error: {
      message: err.message,
    },
  });
  return;
}

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        message: "Validation failed",
        details: err.issues,
      },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json({
        success: false,
        error: {
          message: "Resource not found",
        },
      });
      return;
    }

    if (err.code === "P2002") {
      res.status(409).json({
        success: false,
        error: {
          message: "Resource already exists",
        },
      });
      return;
    }
  }

  // Invalid JSON sent in the request body
  if ("status" in err && err.status === 400) {
    res.status(400).json({
      success: false,
      error: {
        message: "Invalid request",
      },
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: {
      message: "Internal server error",
    },
  });
}