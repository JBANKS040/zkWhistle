import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { proof, publicSignals, encryptedData } = await request.json()

    // Format proof for contract submission
    const formattedArgs = {
      pA: proof.pi_a,
      pB: proof.pi_b,
      pC: proof.pi_c,
      pubSignals: publicSignals,
      encryptedData: encryptedData || "0x"
    }

    return NextResponse.json(formattedArgs)
  } catch (error) {
    console.error('Error formatting proof:', error)
    return NextResponse.json(
      { error: 'Failed to format proof for contract' },
      { status: 500 }
    )
  }
} 