import { Request, Response } from "express";
import { prisma } from "../config/db.js";

// GET(get flash deals products): /api/products/flash-deals
export const getFlashDeals = async (req: Request, res: Response) => {
  const products = await prisma.product.findMany({
    where: { stock: { gt: 0 } }, // gt - greater then
    orderBy: { originalPrice: "desc" }, // desc - descending
  });

  const productsWithDiscount = products.map((item: any) => {
    const discount =
      item.originalPrice && item.price
        ? Math.round(
            ((item.originalPrice - item.price) / item.originalPrice) * 100
          )
        : 0;
    return { ...item, discount };
  });

  res.json({ products: productsWithDiscount.slice(0, 8) });
};

// GET(get all products): /api/products
export const getProducts = async (req: Request, res: Response) => {
  const { category, search, minPrice, maxPrice, sort } = req.query;

  const where: any = {};
  if (category && category !== "all") where.category = category as string;
  if (search) where.name = { contains: search as string, mode: "insensitive" };
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = Number(minPrice); // gte - greater then or equal
    if (maxPrice) where.price.lte = Number(maxPrice); // lte - less then or equal
  }

  const orderBy: any = {};
  if (sort === "price-low") orderBy.price = "asc"; // assendening
  else if (sort === "price-high") orderBy.price = "desc"; // descending
  else orderBy.createdAt = "desc";

  const products = await prisma.product.findMany({ where, orderBy });

  const productsWithDiscount = products.map((item: any) => {
    const discount =
      item.originalPrice && item.price
        ? Math.round(
            ((item.originalPrice - item.price) / item.originalPrice) * 100
          )
        : 0;
    return { ...item, discount };
  });

  res.json({ products: productsWithDiscount });
};

// GET(get single product): /api/products/:id
export const getProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id as string },
  });

  if (!product) {
    res.status(404).json({ message: " Product not found" });
    return;
  }

  const discount =
    product.originalPrice && product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  res.json({ ...product, discount });
};

// POST(create a product): /api/products
export const createProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.create({ data: req.body });
  res.status(201).json({ product });
};

// PUT(update a product): /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  const product = await prisma.product.update({
    where: { id: req.params.id as string },
    data: req.body,
  });
  res.json({ product });
};

// DELETE(delete a product): /api/products/:id
export const deleteProduct = async (req: Request, res: Response) => {
  await prisma.product.delete({
    where: { id: req.params.id as string },
  });
  res.json({ message: "Product Deleted" });
};
