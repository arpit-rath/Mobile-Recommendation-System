# Samsung Mobile Recommendation System

A Samsung smartphone recommendation system that uses feature engineering, ChromaDB for semantic retrieval, and Llama 3.2 for conversational explanations.

## Pipeline

```
Raw Dataset → Data Cleaning → Feature Engineering → ChromaDB Population → Recommendation Engine (Llama 3.2)
```

## Project Structure

- `data/raw/` — Samsung phone dataset (`SamsungPhoneData.csv`, 612 phones, no tablets)
- `data/processed/` — Cleaned and engineered datasets
- `data/chroma_db/` — ChromaDB vector database
- `notebooks/` — Step-by-step analysis notebooks (Data Collection → Validation → Cleaning → EDA → Feature Engineering → Evaluation)
- `src/` — Reusable pipeline code
  - `preprocess.py` — Data cleaning pipeline
  - `utils.py` — ChromaDB utilities and document creation
  - `populate_db.py` — ChromaDB population script
  - `predict.py` — Recommendation engine with persona-based queries
- `docs/` — Project documentation

## How It Works

1. **Feature Engineering**: Extracts numeric features (RAM, storage, battery, camera, etc.) and computes subsystem scores (performance, camera, battery, display, AI, durability)
2. **Recommendation Score**: Weighted combination of subsystem scores (Performance 30%, Camera 25%, Battery 15%, Display 15%, AI 10%, Durability 5%)
3. **ChromaDB**: Semantic search with metadata filtering for persona-based retrieval
4. **Llama 3.2**: Generates conversational, persona-aware recommendation explanations
5. **2024+ Focus**: Defaults to recommending phones from 2024 onwards unless the user specifies otherwise

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run the full pipeline
python src/preprocess.py
jupyter nbconvert --to notebook --execute notebooks/05_Feature_Engineering.ipynb
python src/populate_db.py

# Get recommendations
python src/predict.py
```

## Personas

1. **The Power User** — Fastest, most future-proof flagship
2. **The Conscious Optimizer** — Best value for money
3. **The Content Creator** — Best camera system
4. **The Minimalist** — Reliable, uncomplicated device
5. **The Mobile Gamer** — Best gaming performance
6. **The Feature-Driven Searcher** — Custom feature/budget search
