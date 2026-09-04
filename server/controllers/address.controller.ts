import { Request, Response } from "express";
import { prisma } from "../config/db.js";

// GET: /api/addresses (get user addresses)
export const getUserAddresses = async (req: Request, res: Response) => {
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json({ addresses });
};

// POST: /api/addresses (add user addresses)
export const addUserAddresses = async (req: Request, res: Response) => {
  const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

  // Require coordinates
  if (lat == null || lng == null) {
    return res.status(400).json({
      message:
        "Location coordinates are required. Please allow location access",
    });
  }

  const currentAddresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
  });

  let makeDefault = isDefault;
  if (currentAddresses.length === 0) makeDefault = true;

  if (makeDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });
  }
  await prisma.address.create({
    data: {
      userId: req.user!.id,
      label,
      address,
      city,
      state,
      zip,
      isDefault: makeDefault,
      lat: Number(lat),
      lng: Number(lng),
    },
  });
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.status(201).json({ addresses });
};

// :PUT: /api/addresses/:id (update user addresses)
export const updateUserAddresses = async (req: Request, res: Response) => {
  const { label, address, city, state, zip, isDefault, lat, lng } = req.body;

  // Require coordinates
  if (lat == null || lng == null) {
    return res.status(400).json({
      message:
        "Location coordinates are required. Please allow location access",
    });
  }

  if (isDefault) {
    await prisma.address.updateMany({
      where: { userId: req.user!.id },
      data: { isDefault: false },
    });
  }
  const data: any = {};
  if (label) data.label = label;
  if (address) data.address = address;
  if (city) data.city = city;
  if (state) data.state = state;
  if (zip) data.zip = zip;
  if (isDefault !== undefined) data.isDefault = isDefault;
  if (lat != null) data.lat = Number(lat);
  if (lng != null) data.lng = Number(lng);

  try {
    await prisma.address.update({
      where: { id: req.params.id as string },
      data,
    });
  } catch (error) {
    return res.status(404).json({ message: "Address not found" });
  }
  const addresses = await prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });

  res.json({ addresses });
};

// DELETE: /api/addresses/:id (delete user addresses)
export const deleteUserAddresses = async (req: Request, res: Response) => {
  try {
    await prisma.address.delete({ where: { id: req.params.id as string } });
  } catch (error: any) {
    console.log(error.message);
  }

  const addresses = prisma.address.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "asc" },
  });
  res.json({ addresses });
};
