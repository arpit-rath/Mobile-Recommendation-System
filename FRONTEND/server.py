import os
import sys
import numpy as np
import pandas as pd
from flask import Flask, jsonify, request, send_from_directory
# Ensure src directory is in sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(os.path.abspath(os.path.join(script_dir, '..', 'src')))
from predict import query_and_rank_recommendations, PERSONAS
app = Flask(__name__, static_folder=script_dir, static_url_path='')
@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')
@app.route('/api/recommend', methods=['POST'])
def recommend():
    try:
        data = request.json or {}
        persona_id = data.get('persona_id')
        user_query = data.get('query', '')
        if persona_id is None:
            return jsonify({"error": "persona_id is required"}), 400
        try:
            persona_id = int(persona_id)
        except ValueError:
            return jsonify({"error": "persona_id must be an integer"}), 400
        if persona_id not in PERSONAS:
            return jsonify({"error": f"Invalid persona ID. Must be 1-6"}), 400
        # Get parent dir of this script to point to the correct chroma database
        script_dir = os.path.dirname(os.path.abspath(__file__))
        persist_dir = os.path.join(script_dir, "../data/chroma_db")
        # Run query and rank
        explanation, df_candidates = query_and_rank_recommendations(persona_id, user_query, persist_dir=persist_dir)
        # Replace disclaimer text
        explanation = explanation.replace("These phones are recommended on the basis of launch price", "Recommendations may vary. Verify specifications before purchase.")
        # Convert DataFrame to JSON serializable list by converting NaNs to None (null)
        candidates_list = []
        if df_candidates is not None and not df_candidates.empty:
            df_cleaned = df_candidates.where(pd.notnull(df_candidates), None)
            candidates_list = df_cleaned.to_dict(orient='records')
        # Separate top 3 and remaining candidates
        top_recommendations = candidates_list[:3]
        other_candidates = candidates_list[3:]
        # Create persona info to return
        persona_info = {
            "name": PERSONAS[persona_id]["name"],
            "goal": PERSONAS[persona_id]["goal"],
            "id": persona_id
        }
        return jsonify({
            "explanation": explanation,
            "recommendations": top_recommendations,
            "candidates": candidates_list,
            "persona": persona_info
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting Samsung Mobile Recommendation Server on http://localhost:{port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
