import jwt, { type SignOptions } from "jsonwebtoken";

type JWTPayload = {
  id: string;
  role?: "user" | "delivery" | "admin";
};

const generateJWTToken = (
  payload: JWTPayload,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn,
  });
};

export default generateJWTToken;
