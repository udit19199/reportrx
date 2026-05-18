from qdrant_client import QdrantClient, models

from src.logging_setup import get_logger
from src.config import get_settings

logger = get_logger("vector-store")
settings = get_settings()

COLLECTION_NAME = settings.vector_collection

_client: QdrantClient | None = None


async def start_qdrant() -> None:
    """Connect to Qdrant server and ensure the collection exists."""
    global _client

    if _client is not None:
        return

    logger.info(f"Connecting to Qdrant at {settings.qdrant_url}...")

    _client = QdrantClient(url=settings.qdrant_url)

    existing = [c.name for c in _client.get_collections().collections]

    if COLLECTION_NAME not in existing:
        logger.info(f"Creating collection {COLLECTION_NAME} (dim={settings.embed_dim})...")
        _client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=settings.embed_dim,
                distance=models.Distance.COSINE,
            ),
        )
        _client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="user_id",
            field_type=models.PayloadSchemaType.KEYWORD,
        )
        _client.create_payload_index(
            collection_name=COLLECTION_NAME,
            field_name="report_id",
            field_type=models.PayloadSchemaType.KEYWORD,
        )
        logger.info(f"Collection {COLLECTION_NAME} created successfully")
    else:
        info = _client.get_collection(COLLECTION_NAME)
        current_dim = info.config.params.vectors.size
        if current_dim != settings.embed_dim:
            logger.warning(
                f"Collection {COLLECTION_NAME} has dim={current_dim} but config requires dim={settings.embed_dim}. "
                f"Recreating collection..."
            )
            _client.delete_collection(COLLECTION_NAME)
            _client.create_collection(
                collection_name=COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=settings.embed_dim,
                    distance=models.Distance.COSINE,
                ),
            )
            _client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="user_id",
                field_type=models.PayloadSchemaType.KEYWORD,
            )
            _client.create_payload_index(
                collection_name=COLLECTION_NAME,
                field_name="report_id",
                field_type=models.PayloadSchemaType.KEYWORD,
            )
            logger.info(f"Collection {COLLECTION_NAME} recreated with dim={settings.embed_dim}")
        else:
            logger.info(f"Collection {COLLECTION_NAME} already exists (dim={current_dim})")


async def stop_qdrant() -> None:
    """Close the Qdrant client."""
    global _client
    if _client is not None:
        logger.info("Closing Qdrant client...")
        try:
            _client.close()
        except Exception as e:
            logger.warning(f"Error closing Qdrant: {e}")
        _client = None


def _get_client() -> QdrantClient:
    if _client is None:
        raise RuntimeError("Qdrant client not initialized — call start_qdrant() first")
    return _client


def _format_source(page: int | None, section: str | None) -> str:
    parts = []
    if page is not None:
        parts.append(f"p.{page}")
    if section:
        parts.append(section)
    return " ".join(parts) or "report"


async def upsert_vectors(
    user_id: str,
    items: list[dict],
) -> None:
    """Insert or update vectors with their payloads."""
    client = _get_client()

    points = [
        models.PointStruct(
            id=item["id"],
            vector=item["vector"],
            payload={
                "user_id": user_id,
                "report_id": item["report_id"],
                "text": item["text"],
                "page": item.get("page"),
                "section": item.get("section", ""),
            },
        )
        for item in items
    ]

    try:
        client.upsert(collection_name=COLLECTION_NAME, points=points)
    except Exception as e:
        logger.error(f"Upsert failed: {e}")
        raise


async def search_vectors(
    query_vector: list[float],
    user_id: str,
    report_id: str,
    top_k: int,
) -> tuple[list[str], list[str]]:
    """Search for the most relevant chunks by vector similarity."""
    client = _get_client()

    try:
        results = client.query_points(
            collection_name=COLLECTION_NAME,
            query=query_vector,
            query_filter=models.Filter(
                must=[
                    models.FieldCondition(
                        key="user_id", match=models.MatchValue(value=user_id)
                    ),
                    models.FieldCondition(
                        key="report_id", match=models.MatchValue(value=report_id)
                    ),
                ]
            ),
            limit=top_k,
            with_payload=["text", "page", "section"],
        )
    except Exception as e:
        logger.error(f"Search failed: {e}")
        raise

    points = results.points
    contexts = [p.payload.get("text", "") for p in points]
    sources = [
        _format_source(p.payload.get("page"), p.payload.get("section"))
        for p in points
    ]
    return contexts, sources


async def delete_by_report_id(
    user_id: str,
    report_id: str,
) -> None:
    """Delete all vectors belonging to a specific report."""
    client = _get_client()

    try:
        client.delete(
            collection_name=COLLECTION_NAME,
            points_selector=models.FilterSelector(
                filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="user_id", match=models.MatchValue(value=user_id)
                        ),
                        models.FieldCondition(
                            key="report_id", match=models.MatchValue(value=report_id)
                        ),
                    ]
                )
            ),
        )
    except Exception as e:
        logger.error(f"Delete failed: {e}")
        raise
