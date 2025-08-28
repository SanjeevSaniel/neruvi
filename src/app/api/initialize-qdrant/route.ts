import { NextResponse } from 'next/server';

export async function POST() {
  try {
    console.log('🚀 Starting Qdrant initialization from API...');
    
    // Dynamic import to avoid build issues
    const { qdrantRAG } = await import('@/lib/qdrant-rag');
    
    // Initialize the RAG system (this will process and index transcripts if needed)
    await qdrantRAG.initialize();
    
    // Force reprocessing of transcripts
    await qdrantRAG.processAllContent();
    
    // Get final status
    const status = await qdrantRAG.getStatus();
    
    console.log('✅ Qdrant initialization completed');
    
    return NextResponse.json({
      success: true,
      message: 'Qdrant initialization completed',
      status
    });
  } catch (error) {
    console.error('❌ Failed to initialize Qdrant:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}