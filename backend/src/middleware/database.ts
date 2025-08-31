import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDatabaseConnection = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
      res.status(503).json({
      success: false,
      message: 'Database connection unavailable'
    });
    return;
  }
  return next();
};

// Middleware to handle mongoose validation errors
export const handleValidationError = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err: any) => ({
      param: err.path,
      msg: err.message,
      value: err.value
    }));

      res.status(400).json({
      success: false,
      message: 'Dados inválidos',
      errors
    });
    return;
  }

  if (error.code === 11000) {
    // Duplicate key error
    const field = Object.keys(error.keyValue)[0];
      res.status(400).json({
      success: false,
      message: `${field} já está em uso`,
      errors: [{ param: field, msg: 'Valor duplicado' }]
    });
    return;
  }

  next(error);
};