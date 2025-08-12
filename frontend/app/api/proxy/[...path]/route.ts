import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_KEY = process.env.API_KEY;

async function proxyHandler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    
    if (!API_BASE_URL) {
      return NextResponse.json({ error: 'API base URL not configured' }, { status: 500 });
    }

    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Construct the backend URL
    const backendUrl = `${API_BASE_URL}/${path}`;

    // Prepare headers
    const headers: Record<string, string> = {
      'X-API-Key': API_KEY,
    };

    let body: BodyInit | undefined;

    // Only handle body for methods that support it
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      // Handle different content types
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('multipart/form-data')) {
        // For file uploads, forward the FormData directly
        body = await request.formData();
      } else if (contentType?.includes('application/json')) {
        // For JSON requests, forward the JSON and set content type
        headers['Content-Type'] = 'application/json';
        body = await request.text();
      }
    }

    // Forward the request to the backend
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      ...(body && { body }), // Only include body if it exists
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Backend request failed: ${errorText}` }, { status: response.status });
    }

    // Handle different response types
    const responseContentType = response.headers.get('content-type');
    
    if (responseContentType?.includes('application/pdf') || responseContentType?.includes('application/octet-stream')) {
      // For PDF downloads, stream the binary data
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': responseContentType || 'application/pdf',
          'Content-Disposition': response.headers.get('Content-Disposition') || 'attachment; filename="download.pdf"',
        },
      });
    } else {
      // For JSON responses
      const data = await response.json();
      return NextResponse.json(data);
    }

  } catch (error) {
    console.error('Proxy API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Export named handlers for each HTTP method - this is required by Next.js
export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyHandler(request, context);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyHandler(request, context);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyHandler(request, context);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyHandler(request, context);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxyHandler(request, context);
}