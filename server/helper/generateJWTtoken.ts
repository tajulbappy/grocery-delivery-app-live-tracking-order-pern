import jwt, { type SignOptions } from "jsonwebtoken";

const generateJWTToken = (
  id: string,
  expiresIn: SignOptions["expiresIn"] = "7d"
): string => {
  return jwt.sign(id, process.env.JWT_SECRET as string, { expiresIn });
};

export default generateJWTToken;
