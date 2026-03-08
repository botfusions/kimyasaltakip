import os
import asyncio
import json
import requests
import fitz  # PyMuPDF
from datetime import datetime
from typing import List, Dict, Any
from crawl4ai import AsyncWebCrawler, CrawlerRunConfig, CacheMode
from supabase import create_client, Client
from sentence_transformers import SentenceTransformer
import torch

# Configuration from Environment Variables
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Local Embedding Model (Zero Cost)
print("📦 Loading embedding model (all-MiniLM-L6-v2)...")
device = "cuda" if torch.cuda.is_available() else "cpu"
model = SentenceTransformer('all-MiniLM-L6-v2', device=device)

async def get_active_sources():
    """Fetch active intelligence sources from Supabase."""
    response = supabase.table("kts_intelligence_sources").select("*").eq("is_active", True).execute()
    return response.data

async def save_intelligence_data(source_id: str, title: str, content: str, url: str):
    """Generate embedding and save scraped data to Supabase."""
    print(f"🧠 Generating embedding for: {title}")
    
    # Generate vector (384 dimensions for all-MiniLM-L6-v2)
    embedding = model.encode(content).tolist()
    
    data = {
        "source_id": source_id,
        "title": title,
        "content": content,
        "url": url,
        "embedding": embedding,
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Upsert based on URL to avoid duplicates
    supabase.table("kts_intelligence_data").upsert(
        data, on_conflict="url"
    ).execute()
    
    # Update source last_synced_at
    supabase.table("kts_intelligence_sources").update(
        {"last_synced_at": datetime.utcnow().isoformat()}
    ).eq("id", source_id).execute()

def process_pdf(url: str) -> str:
    """Download PDF and extract text content."""
    print(f"📄 Processing PDF: {url}")
    response = requests.get(url, timeout=30)
    response.raise_for_status()
    
    # Open PDF from memory
    doc = fitz.open(stream=response.content, filetype="pdf")
    text = ""
    for page in doc:
        text += page.get_text()
    
    doc.close()
    return text.strip()

async def crawl_and_sync():
    """Main crawler loop."""
    sources = await get_active_sources()
    if not sources:
        print("ℹ️ No active sources found to crawl.")
        return

    print(f"🚀 Starting crawl for {len(sources)} sources...")

    async with AsyncWebCrawler() as crawler:
        for source in sources:
            url = source["url"]
            print(f"🌐 Crawling: {url}")
            
            try:
                if url.lower().endswith(".pdf"):
                    # Process PDF
                    pdf_text = process_pdf(url)
                    if pdf_text:
                        await save_intelligence_data(
                            source_id=source["id"],
                            title=source["name"],
                            content=pdf_text,
                            url=url
                        )
                        print(f"✅ Successfully synced PDF: {url}")
                    else:
                        print(f"⚠️ No text found in PDF: {url}")
                else:
                    # Process normal web page
                    result = await crawler.arun(
                        url=url,
                        config=CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
                    )
                    
                    if result.success:
                        # Save the Markdown content
                        await save_intelligence_data(
                            source_id=source["id"],
                            title=source["name"],
                            content=result.markdown,
                            url=url
                        )
                        print(f"✅ Successfully synced: {url}")
                    else:
                        print(f"⚠️ Failed to crawl {url}: {result.error_message}")
            
            except Exception as e:
                print(f"❌ Unexpected error crawling {url}: {str(e)}")

if __name__ == "__main__":
    asyncio.run(crawl_and_sync())
