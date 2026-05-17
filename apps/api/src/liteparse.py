import asyncio
import json
import re
import shutil


async def parse_pdf(file_path: str) -> list[dict]:
    lit_path = shutil.which("lit")
    if not lit_path:
        raise RuntimeError(
            "lit CLI not found. Install with: npm i -g @llamaindex/liteparse"
        )

    proc = await asyncio.create_subprocess_exec(
        lit_path,
        "parse",
        file_path,
        "--format",
        "json",
        "--quiet",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    stdout, stderr = await proc.communicate()

    if proc.returncode != 0:
        error_msg = stderr.decode().strip() or f"lit exited with code {proc.returncode}"
        raise RuntimeError(f"LiteParse failed: {error_msg}")

    try:
        data = json.loads(stdout)
    except json.JSONDecodeError as e:
        raise RuntimeError(f"LiteParse returned invalid JSON: {e}")

    pages = data.get("pages", [])
    if not pages:
        return []

    return build_section_chunks(pages)


def detect_heading_font_size(pages: list[dict]) -> float:
    """Find the font size threshold that separates headings from body text.

    Collects all distinct font sizes across textItems and picks a natural
    break point: the largest gap between consecutive sizes.  If fewer than
    3 distinct sizes exist, falls back to a heuristic (anything >= 14pt).
    """
    sizes: set[float] = set()
    for page in pages:
        for item in page.get("textItems", []):
            fs = item.get("fontSize", 0)
            if fs > 0:
                sizes.add(fs)

    if len(sizes) < 3:
        return 14.0

    sorted_sizes = sorted(sizes)
    gaps = [(sorted_sizes[i + 1] - sorted_sizes[i], i) for i in range(len(sorted_sizes) - 1)]
    largest_gap = max(gaps, key=lambda g: g[0])
    # Threshold is the smaller size in the pair with the biggest gap
    return sorted_sizes[largest_gap[1]]


def extract_sections_from_page(page_data: dict, heading_threshold: float) -> list[dict]:
    """Group textItems on a page into sections based on heading detection.

    Returns a list of {section_name, items} where items is a list of textItem
    dicts belonging to that section.  Heading detection uses fontSize >=
    heading_threshold, and headings are also detected by regex on the
    concatenated page text as a fallback.
    """
    text_items = page_data.get("textItems", [])
    page_num = page_data.get("page", 1)

    # First pass: find heading items by font size
    sections: list[dict] = []
    current_section: str | None = None

    for item in text_items:
        fs = item.get("fontSize", 0)
        text = item.get("text", "").strip()
        if not text:
            continue

        is_heading = fs >= heading_threshold and len(text) > 2

        # Also check for ALL-CAPS or markdown-style headings as fallback
        if not is_heading and (
            re.match(r"^[A-Z][A-Z\s\-:]{3,60}$", text)
            or re.match(r"^#+\s+.+", text)
        ):
            is_heading = True

        if is_heading:
            current_section = text
            sections.append({"section_name": current_section, "page": page_num, "items": []})
        elif current_section:
            sections[-1]["items"].append(item)
        else:
            # Text before any heading — assign to a generic section
            if not sections or sections[-1]["section_name"] != "":
                sections.append({"section_name": "", "page": page_num, "items": []})
            sections[-1]["items"].append(item)

    return sections


def build_section_chunks(pages: list[dict], max_chars: int = 2500) -> list[dict]:
    """Build semantically coherent chunks using LiteParse textItems.

    Sections are detected by font size on each page.  Text items within a
    section are concatenated and split only when max_chars is exceeded,
    preserving section boundaries.  Each chunk carries {text, page, section}.
    """
    heading_threshold = detect_heading_font_size(pages)
    chunks: list[dict] = []

    # Collect all sections across pages, merging same-named sections
    # that appear consecutively across pages
    all_sections: list[dict] = []
    for page in pages:
        page_sections = extract_sections_from_page(page, heading_threshold)
        for ps in page_sections:
            if (
                all_sections
                and all_sections[-1]["section_name"] == ps["section_name"]
            ):
                # Merge with previous page's same section
                all_sections[-1]["items"].extend(ps["items"])
            else:
                all_sections.append(ps)

    # Now chunk each section
    for section in all_sections:
        section_name = section["section_name"]
        # Use the page of the first item, or fall back to section metadata
        first_item = section["items"][0] if section["items"] else None
        page_num = first_item.get("page", section.get("page", 1)) if first_item else section.get("page", 1)

        # Concatenate all text items in order
        full_text = " ".join(item["text"] for item in section["items"] if item.get("text", "").strip())
        if not full_text.strip():
            continue

        # Split into chunks of ~max_chars, but try to break at sentence boundaries
        if len(full_text) <= max_chars:
            chunks.append({"text": full_text.strip(), "page": page_num, "section": section_name})
        else:
            start = 0
            while start < len(full_text):
                end = start + max_chars
                if end >= len(full_text):
                    chunk_text = full_text[start:].strip()
                    chunks.append({"text": chunk_text, "page": page_num, "section": section_name})
                    break

                # Try to break at a sentence boundary near the end
                search_start = max(start + max_chars - 300, start)
                boundary = full_text.rfind(". ", search_start, end)
                if boundary != -1:
                    chunk_text = full_text[start:boundary + 2].strip()
                    start = boundary + 2
                else:
                    chunk_text = full_text[start:end].strip()
                    start = end

                if chunk_text:
                    chunks.append({"text": chunk_text, "page": page_num, "section": section_name})

    return chunks
