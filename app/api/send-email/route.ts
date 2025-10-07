import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400 })
    }

    const SERVICE_ID = process.env.EMAILJS_SERVICE_ID!
    const TEMPLATE_ID = process.env.EMAILJS_TEMPLATE_ID!
    const PUBLIC_KEY = process.env.EMAILJS_PUBLIC_KEY!

    const body = {
      service_id: SERVICE_ID,
      template_id: TEMPLATE_ID,
      user_id: PUBLIC_KEY,
      template_params: {
        from_name: name,
        from_email: email,
        subject: subject || "(No Subject)",
        message: message,
      },
    }

    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    // EmailJS returns empty body even when success, so just check status
    if (!response.ok) {
      const text = await response.text()
      console.error("EmailJS failed:", text)
      throw new Error(`EmailJS request failed: ${response.statusText}`)
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error("Server error sending email:", error)
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500 })
  }
}
