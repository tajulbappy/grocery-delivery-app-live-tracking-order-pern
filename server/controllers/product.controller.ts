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
    res.status(404).json({ message: "Product not found" });
    return;
  }

  const discount =
    product.originalPrice && product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

  res.json({
    product: {
      ...product,
      discount,
    },
  });
};

// POST(create a product): /api/products
export const createProduct = async (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      originalPrice,
      image,
      category,
      unit,
      stock,
      isOrganic,
    } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: Number(price),
        originalPrice: Number(originalPrice),
        image,
        category,
        unit,
        stock: Number(stock),
        isOrganic: isOrganic === true || isOrganic === "true",
      },
    });

    res.status(201).json({ product });
  } catch (error: any) {
    console.error("Create product error:", error);

    res.status(500).json({
      message: error.message || "Failed to create product",
    });
  }
};

// PUT(update a product): /api/products/:id
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.update({
      where: {
        id: req.params.id as string,
      },
      data: {
        name: req.body.name,
        description: req.body.description,
        price: Number(req.body.price),
        originalPrice: Number(req.body.originalPrice),
        image: req.body.image,
        category: req.body.category,
        unit: req.body.unit,
        stock: Number(req.body.stock),
        isOrganic: Boolean(req.body.isOrganic),
      },
    });

    res.json({ product });
  } catch (error: any) {
    console.error("Update product error:", error);

    res.status(500).json({
      message: error.message || "Failed to update product",
    });
  }
};

// UPDATE(Update product STOCK): /api/products/:id/out-of-stock (when admin delete a product then that product will display as a out of stock")
export const updateProductStock = async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.update({
      where: {
        id: req.params.id as string,
      },
      data: {
        stock: 0,
      },
    });

    res.json({
      message: "Product marked as out of stock",
      product,
    });
  } catch (error: any) {
    console.error("Update stock error:", error);

    res.status(500).json({
      message: error.message || "Failed to update product stock",
    });
  }
};
