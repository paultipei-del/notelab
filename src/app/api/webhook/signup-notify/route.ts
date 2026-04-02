import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const body = await req.json()
    const email = body?.record?.email ?? body?.email ?? 'unknown'
    const created = body?.record?.created_at ?? new Date().toISOString()

    await resend.emails.send({
      from: 'NoteLab <notifications@notelab.studio>',
      to: 'paul@paulvoiatipei.com',
      subject: `New signup: ${email}`,
      html: `<p style="font-family:sans-serif"><strong>New NoteLab signup</strong><br/><br/>Email: ${email}<br/>Time: ${new Date(created).toLocaleString()}</p>`,
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('Signup notify error:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
