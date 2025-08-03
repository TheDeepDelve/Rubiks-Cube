# Rubik's Cube Solver: A Tale of Two Minds

An interactive 3D Rubik's Cube solver that explores the fascinating contrast between machine-optimal algorithms and human-style solving strategies. This project was developed for the **AeroHack '25 Design Challenge**.

*(Suggestion: Replace this link with a high-quality screenshot or a GIF of your final application in action.)*

## 🌟 Core Concept: Human vs. Machine

This project goes beyond a simple solver. It's an interactive platform designed to visualize and compare two fundamentally different approaches to solving a Rubik's Cube:

1.  **The Machine Mind (Kociemba's Algorithm):** Utilizes Herbert Kociemba's powerful two-phase algorithm to find a mathematically optimal (shortest) solution. It's incredibly fast and efficient but often produces move sequences that are non-intuitive to a human.

2.  **The Human-Style Mind (Hybrid Solver):** Simulates a less direct, more "human-like" approach. It takes the optimal solution and strategically modifies it by inserting common algorithms used by speedcubers. This results in a longer but still correct solution, demonstrating a different strategic path.

By comparing these two methods side-by-side, the application serves as an educational tool for exploring algorithmic theory and problem-solving strategies.

## ✨ Features

* **Interactive 3D Cube:** A fully interactive 3D Rubik's Cube built with React Three Fiber, allowing you to rotate and inspect the cube from any angle.
* **Dual Solving Methods:** Choose between the "Machine" and "Human-Style" solvers to generate and compare different solutions.
* **Fluid Animations:** All scrambles and solutions are smoothly animated, providing a clear, step-by-step visualization of the process.
* **Live Statistics Panel:** When a solution is animating, a dedicated panel appears, providing real-time statistics on:
    * Total Moves
    * Current Step
    * Solve Time
    * Progress Bar
* **Polished & Responsive UI:** A modern, clean user interface with a "floating card" design that is fully responsive and looks great on any screen size.
* **Customizable Scramble:** Use the number counter to choose the difficulty of the random scramble, from a few moves to a complex, 50-move sequence.
* **State-Aware Logic:** The application intelligently handles the cube's state, providing a seamless user experience (e.g., animating a "return to scramble" sequence before solving an already-solved cube).

## 🛠️ Tech Stack

This project uses a modern, decoupled architecture to separate the powerful backend logic from the interactive frontend experience.

* **Frontend:**
    * **React:** For building the dynamic user interface.
    * **Three.js & React Three Fiber:** For rendering and animating the 3D Rubik's Cube.
    * **Tailwind CSS:** For styling the modern, responsive layout.
* **Backend:**
    * **Python:** The core language for the solving logic.
    * **Flask:** A lightweight web server to create the API endpoint.
    * **`pycuber`:** A library for modeling the Rubik's Cube state and transitions.
    * **`kociemba`:** The powerful library that implements the two-phase solving algorithm.

## 🚀 Getting Started

To run this project locally, you will need to have Python and Node.js installed.

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows, use `venv\Scripts\activate`

# Install the required Python packages
pip install Flask Flask-Cors pycuber kociemba

# Run the Flask server
python app.py
```

The backend server will start on `http://localhost:5000`.

### 2. Frontend Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install the required Node.js packages
npm install

# Run the React development server
npm start
```

The frontend application will open in your browser at `http://localhost:3000` (or another port if 3000 is in use).
