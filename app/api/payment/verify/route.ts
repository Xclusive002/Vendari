import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { reference } = await request.json()

    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      )
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY

    if (!paystackSecretKey) {
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      )
    }

    // Verify payment with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
        },
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Payment verification failed', details: data },
        { status: 400 }
      )
    }

    // Check if payment was successful
    if (data.data.status === 'success') {
      return NextResponse.json({
        success: true,
        amount: data.data.amount / 100, // Convert from kobo to naira
        reference: data.data.reference,
        message: 'Payment verified successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Payment was not completed successfully' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('[v0] Payment verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
