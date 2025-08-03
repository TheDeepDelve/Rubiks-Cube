import pycuber as pc
import kociemba
import traceback

COLOR_MAP = {
    'white':  'D', 'yellow': 'U',
    'green':  'F', 'blue':   'B',
    'red':    'L', 'orange': 'R',
}

def get_kociemba_string(cube):
    """Generates the 54-character string for Kociemba from a pycuber object."""
    face_order = ['U', 'R', 'F', 'D', 'L', 'B']
    kociemba_list = []
    for face_char in face_order:
        face = cube.get_face(face_char)
        for i in range(3):
            for j in range(3):
                sticker_color_name = str(face[i][j].colour)
                kociemba_list.append(COLOR_MAP[sticker_color_name])
    return "".join(kociemba_list)

def solve_kociemba(cube):
    """Takes a pycuber.Cube object and returns the Kociemba solution string."""
    try:
        kociemba_str = get_kociemba_string(cube)
        solution = kociemba.solve(kociemba_str)
        return solution
    except Exception as e:
        print(f"!!! Kociemba solver failed: {e}")
        traceback.print_exc()
        return f"Error: Kociemba solver failed. ({e})"

def solve_human_hybrid(scramble_moves_str):
    """
    Simulates a human-style solve by modifying the scramble before solving.
    This creates a different, correct, and non-optimal solution path.
    """
    if not scramble_moves_str:
        return {"error": "No scramble provided"}


    MODIFICATION_ALGO = "R U R' U' R' F R2 U' R' U' R U R' F'"

    cube = pc.Cube()
    cube(scramble_moves_str)


    cube(MODIFICATION_ALGO)


    solution_for_modified_cube = solve_kociemba(cube)
    
    if "Error" in solution_for_modified_cube:
        return {"error": solution_for_modified_cube}


    full_solution_str = f"{MODIFICATION_ALGO} {solution_for_modified_cube}"
    
    return {
        "full_solution": full_solution_str,
    }

def solve_kociemba_from_scramble(scramble_moves_str):
    """Wrapper to create a cube and solve it with Kociemba."""
    if not scramble_moves_str:
        return ""
    cube = pc.Cube()
    cube(scramble_moves_str)
    return solve_kociemba(cube)
