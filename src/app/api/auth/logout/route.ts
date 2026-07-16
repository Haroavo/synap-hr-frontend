import { NextResponse } from "next/server";

const COOKIE_NAME = "synaprh_access_token";

export async function POST() {
  const response = NextResponse.json(
    {
      message: "Déconnexion effectuée avec succès.",
    },
    {
      status: 200,
    },
  );

  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
