from flask import Flask, request, jsonify
from flask_cors import CORS
import solver

app = Flask(__name__)
CORS(app, resources={r"/solve": {"origins": "*"}})

@app.route('/solve', methods=['POST'])
def solve_cube_endpoint():
    """ A unified endpoint to handle different solving methods. """
    data = request.json
    if not data:
        return jsonify({"error": "Invalid request: No JSON body."}), 400
        
    scramble_moves = data.get('scramble_moves', "")
    method = data.get('method', "kociemba")

    print(f"Request received for method '{method}'")

    if method == "kociemba":
        solution = solver.solve_kociemba_from_scramble(scramble_moves)
        if "Error" in solution:
            return jsonify({"error": solution}), 400
        return jsonify({"solution": solution, "method": "Kociemba"})
    
    elif method == "human_hybrid":
        solution_parts = solver.solve_human_hybrid(scramble_moves)
        if "error" in solution_parts:
            return jsonify(solution_parts), 400
        return jsonify({**solution_parts, "method": "Human-Hybrid", "full_solution": solution_parts.get("full_solution")})
    
    else:
        return jsonify({"error": "Invalid method specified"}), 400

if __name__ == '__main__':
    print("Starting Flask server for Rubik's Cube solver...")
    app.run(host='0.0.0.0', port=5000)