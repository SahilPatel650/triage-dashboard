import { NextResponse } from "next/server";

let patients = [];

export async function GET() {
  return new Response(JSON.stringify(patients), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// Route handler for POST requests
export async function POST(req) {
  try {
    // Parse the incoming JSON data
    const data = await req.json();
    if ("del" in data) {
      patients = [];
    } else if (data) {
      data.id = patients.length;
      patients.push(data);
    }

    return NextResponse.json({
      message: "Data received successfully",
      data: data,
    });
  } catch (error) {
    // Handle any errors
    console.error("Error parsing data:", error);

    return NextResponse.json(
      {
        message: "Error processing request",
        error: error.message,
      },
      { status: 400 },
    );
  }
}
