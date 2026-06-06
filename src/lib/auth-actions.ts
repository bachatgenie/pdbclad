"use server";

import { hashSync } from "bcryptjs";
import { prisma } from "./prisma";

export async function registerUser(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const betaCode = (formData.get("betaCode") as string)?.trim().toUpperCase();

  // Validate required fields
  if (!name || !email || !password || !betaCode) {
    return { error: "All fields are required." };
  }

  // Check beta code
  const validCode = process.env.BETA_CODE?.toUpperCase();
  if (!validCode) {
    return { error: "Beta signups are currently closed." };
  }
  if (betaCode !== validCode) {
    return { error: "Invalid beta code. Contact Avadh to get access." };
  }

  // Check email not already taken
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  // Create user
  try {
    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashSync(password, 12),
        xp: 0,
        level: 1,
      },
    });

    return { success: true };
  } catch (e) {
    console.error("Registration error:", e);
    return { error: "Something went wrong. Please try again." };
  }
}
