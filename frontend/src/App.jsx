import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useSpring, a } from '@react-spring/three';

// --- CONFIGURATION & HELPERS ---
const moveConfig = {
    'U': { axis: 'y', angle: -1, select: (p) => Math.round(p.y) > 0 }, "U'": { axis: 'y', angle: 1, select: (p) => Math.round(p.y) > 0 },
    'D': { axis: 'y', angle: 1, select: (p) => Math.round(p.y) < 0 }, "D'": { axis: 'y', angle: -1, select: (p) => Math.round(p.y) < 0 },
    'R': { axis: 'x', angle: -1, select: (p) => Math.round(p.x) > 0 }, "R'": { axis: 'x', angle: 1, select: (p) => Math.round(p.x) > 0 },
    'L': { axis: 'x', angle: 1, select: (p) => Math.round(p.x) < 0 }, "L'": { axis: 'x', angle: -1, select: (p) => Math.round(p.x) < 0 },
    'F': { axis: 'z', angle: -1, select: (p) => Math.round(p.z) > 0 }, "F'": { axis: 'z', angle: 1, select: (p) => Math.round(p.z) > 0 },
    'B': { axis: 'z', angle: 1, select: (p) => Math.round(p.z) < 0 }, "B'": { axis: 'z', angle: -1, select: (p) => Math.round(p.z) < 0 },
};
const allMoves = ["U", "U'", "U2", "D", "D'", "D2", "R", "R'", "R2", "L", "L'", "L2", "F", "F'", "F2", "B", "B'", "B2"];

const getInitialVisualState = () => {
    const initialCubies = [];
    const colors = { white: '#ffffff', yellow: '#ffff00', red: '#b71234', orange: '#ff8c00', blue: '#0046ad', green: '#009b48', black: '#222222' };
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
        if (x === 0 && y === 0 && z === 0) continue;
        initialCubies.push({
            id: `${x}${y}${z}`, position: new THREE.Vector3(x * 1.05, y * 1.05, z * 1.05), rotation: new THREE.Euler(0, 0, 0),
            colors: [
                x === 1 ? colors.red : colors.black, x === -1 ? colors.orange : colors.black,
                y === 1 ? colors.white : colors.black, y === -1 ? colors.yellow : colors.black,
                z === 1 ? colors.green : colors.black, z === -1 ? colors.blue : colors.black,
            ]
        });
    }
    return initialCubies;
};

// --- UI COMPONENTS ---
const SolutionSteps = ({ solution, currentMoveIndex, solveTime }) => {
    if (!solution || solution.length === 0) return null;
    const moves = solution.split(' ').filter(Boolean);
    const totalMoves = moves.length;
    const displayStep = Math.min(currentMoveIndex, totalMoves);
    const progress = totalMoves > 0 ? (displayStep / totalMoves) * 100 : 0;
    return (
        <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-lg w-full flex-shrink-0 shadow-2xl shadow-black/30 border border-white/10">
            <h2 className="text-xl font-light text-slate-100 mb-3">Solution Steps</h2>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-grow">
                    <h3 className="text-lg text-slate-400 mb-2">Move Sequence:</h3>
                    <div className="flex flex-wrap gap-2 p-2 bg-slate-900/70 rounded-lg h-32 overflow-y-auto content-start custom-scrollbar">
                        {moves.map((move, index) => (
                            <span key={index} className={`font-mono text-sm px-2 py-1 rounded-md transition-all duration-150 ${index === currentMoveIndex - 1 ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-110' : 'bg-slate-700 text-slate-300'}`}>
                                {move}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex-shrink-0 w-full md:w-48">
                    <h3 className="text-lg text-slate-400 mb-2">Statistics:</h3>
                    <div className="space-y-2 text-sm text-slate-300">
                        <p>Total Moves: <span className="font-bold text-yellow-400">{totalMoves}</span></p>
                        <p>Current Step: <span className="font-bold text-yellow-400">{displayStep} / {totalMoves}</span></p>
                        <p>Solve Time: <span className="font-bold text-yellow-400">{solveTime.toFixed(2)}s</span></p>
                        <div>
                            <p>Progress: <span className="font-bold text-yellow-400">{Math.round(progress)}%</span></p>
                            <div className="w-full bg-slate-700 rounded-full h-2.5 mt-1"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SolutionComparison = ({ results, onAnimate, isAnimating }) => {
    const ResultCard = ({ title, data, onAnimate, isAnimating, method, description }) => {
        if (!data) return (
            <div className="bg-slate-800/60 p-4 rounded-lg flex-1 min-h-[280px] flex flex-col">
                <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 mt-4">Click a "Solve" button to generate a solution here.</p>
            </div>
        );
        const fullSolution = data.full_solution || data.solution;
        const moveCount = fullSolution.split(' ').filter(Boolean).length;
        return (
            <div className="bg-slate-800/60 p-4 rounded-lg flex-1 min-h-[280px] flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
                    <p className="text-sm text-slate-400 mb-2 min-h-[4rem]">{description}</p>
                    <div className="bg-slate-900/70 p-2 rounded mb-3"><p className="font-mono text-slate-300 text-sm">Moves: <span className="font-bold text-blue-400">{moveCount}</span></p></div>
                    <div className="bg-slate-900/70 p-2 rounded mb-3 h-24 overflow-y-auto custom-scrollbar"><p className="font-mono text-green-400 text-xs break-words">{fullSolution}</p></div>
                </div>
                <button onClick={() => onAnimate(data, method)} className="w-full mt-auto p-2 rounded bg-green-600 hover:bg-green-500 text-white font-bold transition-colors disabled:opacity-50 shadow-md hover:shadow-lg" disabled={isAnimating}>Animate</button>
            </div>
        );
    };
    return (
        <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-lg w-full flex-shrink-0 shadow-2xl shadow-black/30 border border-white/10">
            <h2 className="text-xl font-light text-slate-100 mb-3">Solution Comparison</h2>
            <div className="flex flex-col md:flex-row gap-4">
                <ResultCard title="Optimal" data={results.kociemba} onAnimate={onAnimate} isAnimating={isAnimating} method="kociemba" description="Finds an optimal path using pre-computed tables. Fast and efficient, but moves can be non-intuitive."/>
                <ResultCard title="Brute Force (Human-Style)" data={results.human} onAnimate={onAnimate} isAnimating={isAnimating} method="human" description="Simulates a less direct path by adding extra algorithms, resulting in more moves but demonstrating a different strategy."/>
            </div>
        </div>
    );
};

const NumberInput = ({ value, onChange, min, max, disabled }) => {
    const handleChange = (amount) => {
        const newValue = Math.max(min, Math.min(max, value + amount));
        onChange(newValue);
    };
    return (
        <div className="flex items-center justify-between bg-slate-900/70 rounded-lg p-2">
            <span className="text-sm font-medium text-slate-300">Scramble Moves:</span>
            <div className="flex items-center gap-2">
                <span className="font-bold text-purple-400 text-lg">{value}</span>
                <div className="flex flex-col">
                    <button onClick={() => handleChange(1)} disabled={disabled || value >= max} className="disabled:opacity-30 text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" /></svg></button>
                    <button onClick={() => handleChange(-1)} disabled={disabled || value <= min} className="disabled:opacity-30 text-white"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg></button>
                </div>
            </div>
        </div>
    );
}

const ActionPanel = ({ onSolve, onScramble, onReset, isAnimating, scrambleLength, setScrambleLength }) => {
    const buttonStyle = "w-full p-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";
    return (
        <div className="bg-slate-800/50 backdrop-blur-md p-6 rounded-lg flex-shrink-0 shadow-2xl shadow-black/30 border border-white/10">
            <h1 className="text-2xl font-bold text-white mb-4">Quick Actions</h1>
            <div className="space-y-4">
                <button onClick={onReset} className={`${buttonStyle} bg-slate-600 hover:bg-slate-500 text-white`} disabled={isAnimating}>Reset Cube</button>
                <NumberInput value={scrambleLength} onChange={setScrambleLength} min={1} max={50} disabled={isAnimating} />
                <button onClick={onScramble} className={`${buttonStyle} bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white`} disabled={isAnimating}>Random Scramble</button>
                <div className="grid grid-cols-2 gap-3 pt-2">
                     <button onClick={() => onSolve('kociemba')} className={`${buttonStyle} bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold`} disabled={isAnimating}>Solve (Optimal)</button>
                     <button onClick={() => onSolve('human_hybrid')} className={`${buttonStyle} bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold`} disabled={isAnimating}>Solve (Human-Style)</button>
                </div>
            </div>
        </div>
    );
};

const StatusBar = ({ status }) => (
    <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-md p-3 text-center rounded-lg shadow-2xl shadow-black/30 border border-white/10">
        <p className="font-light text-white">Status: <span className="text-yellow-400 font-semibold">{status}</span></p>
    </div>
);

// --- CUBIE & ANIMATED CUBE COMPONENTS ---
const AnimatedCubie = ({ position, rotation, colors }) => (
    <a.mesh position={position} rotation={rotation}>
        <boxGeometry args={[1, 1, 1]} />
        {[...Array(6)].map((_, i) => <meshStandardMaterial key={i} attach={`material-${i}`} color={colors[i]} />)}
    </a.mesh>
);

const AnimatedCube = ({ visualCubies, setVisualCubies, animationQueue, onAnimationComplete }) => {
    const groupRef = useRef();
    const [spring, api] = useSpring(() => ({ rotation: [0, 0, 0], config: { tension: 300, friction: 30 } }));
    useEffect(() => {
        if (animationQueue.length > 0) {
            const move = animationQueue[0];
            const moveName = move.endsWith("'") || move.endsWith("2") ? move.slice(0, -1) : move;
            const turns = move.endsWith("'") ? -1 : move.endsWith("2") ? 2 : 1;
            const config = moveConfig[moveName];
            if (!config) { console.error(`Invalid move detected: ${move}`); onAnimationComplete(); return; }
            const targetRotation = new THREE.Vector3();
            targetRotation[config.axis] = (config.angle * Math.PI / 2) * turns;
            api.start({
                to: { rotation: [targetRotation.x, targetRotation.y, targetRotation.z] },
                onRest: () => {
                    const rotationAxis = targetRotation.clone().normalize();
                    const angle = targetRotation.length();
                    setVisualCubies(currentCubies => currentCubies.map(cubie => {
                        const position = new THREE.Vector3().copy(cubie.position);
                        const rotation = new THREE.Euler().copy(cubie.rotation);
                        if (config.select(position)) {
                            const newPosition = position.clone().applyAxisAngle(rotationAxis, angle);
                            newPosition.x = Math.round(newPosition.x / 1.05) * 1.05;
                            newPosition.y = Math.round(newPosition.y / 1.05) * 1.05;
                            newPosition.z = Math.round(newPosition.z / 1.05) * 1.05;
                            const q = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
                            const currentQuaternion = new THREE.Quaternion().setFromEuler(rotation);
                            currentQuaternion.premultiply(q);
                            const newRotation = new THREE.Euler().setFromQuaternion(currentQuaternion, 'XYZ');
                            return { ...cubie, position: newPosition, rotation: newRotation };
                        }
                        return { ...cubie, position, rotation };
                    }));
                    api.set({ rotation: [0, 0, 0] });
                    onAnimationComplete();
                }
            });
        }
    }, [animationQueue, api, setVisualCubies, onAnimationComplete]);
    const move = animationQueue.length > 0 ? animationQueue[0] : null;
    const moveName = move ? (move.endsWith("'") || move.endsWith("2") ? move.slice(0, -1) : move) : null;
    const config = moveName ? moveConfig[moveName] : null;
    const rotatingCubies = config ? visualCubies.filter(c => config.select(new THREE.Vector3().copy(c.position))) : [];
    const staticCubies = config ? visualCubies.filter(c => !config.select(new THREE.Vector3().copy(c.position))) : visualCubies;
    return (<><a.group ref={groupRef} rotation={spring.rotation}>{rotatingCubies.map((cubie) => <AnimatedCubie key={cubie.id} {...cubie} />)}</a.group>{staticCubies.map((cubie) => <AnimatedCubie key={cubie.id} {...cubie} />)}</>);
};


// --- MAIN APP COMPONENT ---
function App() {
    const [visualCubies, setVisualCubies] = useState(getInitialVisualState());
    const [status, setStatus] = useState('Ready');
    const [results, setResults] = useState({ kociemba: null, human: null });
    const [animationQueue, setAnimationQueue] = useState([]);
    const [scrambleSequence, setScrambleSequence] = useState([]);
    const [isSolved, setIsSolved] = useState(true);
    const [followUpAnimation, setFollowUpAnimation] = useState(null);
    const [animationStats, setAnimationStats] = useState({ solution: null, currentMoveIndex: 0, solveTime: 0 });
    const [scrambleLength, setScrambleLength] = useState(20);
    const solveStartTime = useRef(0);

    const isAnimating = animationQueue.length > 0;
    const hasResults = results.kociemba || results.human;
    
    const handleAnimationComplete = useCallback(() => {
        if (status.startsWith('Animating')) {
            setAnimationStats(prev => ({ ...prev, currentMoveIndex: prev.currentMoveIndex + 1 }));
        }
        setAnimationQueue(prev => prev.slice(1));
    }, [status]);

    useEffect(() => {
        if (isAnimating) return;
        if (followUpAnimation) {
            setStatus("Proceeding with solving the cube...");
            const timer = setTimeout(() => {
                const { moves, method } = followUpAnimation;
                setStatus(`Animating ${method === 'kociemba' ? 'Machine' : 'Human-Style'} solution...`);
                setAnimationStats({ solution: moves.join(' '), currentMoveIndex: 1, solveTime: 0 });
                solveStartTime.current = performance.now();
                setAnimationQueue(moves);
                setFollowUpAnimation(null);
            }, 1500);
            return () => clearTimeout(timer);
        }
        if (status.startsWith('Animating')) {
            const endTime = performance.now();
            setAnimationStats(prev => ({ ...prev, currentMoveIndex: prev.solution.split(' ').filter(Boolean).length, solveTime: (endTime - solveStartTime.current) / 1000 }));
            setStatus('Ready');
            setIsSolved(true);
        } else if (status.startsWith('Scrambling') || status.startsWith('Returning')) {
             setStatus('Ready');
             setIsSolved(false);
        }
    }, [isAnimating, followUpAnimation, status]);
    
    const handleScramble = () => {
        if (isAnimating) return;
        setStatus('Scrambling...');
        setResults({ kociemba: null, human: null });
        setAnimationStats({ solution: null, currentMoveIndex: 0, solveTime: 0 });
        const scrambleMoves = Array(scrambleLength).fill(0).map(() => allMoves[Math.floor(Math.random() * allMoves.length)]);
        setScrambleSequence(scrambleMoves);
        setVisualCubies(getInitialVisualState());
        setAnimationQueue(scrambleMoves);
        setIsSolved(false);
    };

    const handleSolve = async (method) => {
        if (isAnimating) return;
        if (scrambleSequence.length === 0) { setStatus("Scramble the cube first!"); return; }
        setStatus(`Requesting ${method === 'kociemba' ? 'Machine' : 'Human-Style'} solution...`);
        try {
            const response = await fetch('http://localhost:5000/solve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scramble_moves: scrambleSequence.join(' '), method: method }),
            });
            if (!response.ok) throw new Error(`Solver API Error: ${response.statusText}`);
            const data = await response.json();
            if (data.error) { setStatus(`Error: ${data.error}`); return; }
            if (method === 'kociemba') {
                setResults(prev => ({...prev, kociemba: data}));
            } else {
                setResults(prev => ({...prev, human: data}));
            }
            setStatus('Solutions received. Choose one to animate.');
        } catch (error) {
            console.error("Error solving cube:", error);
            setStatus('Error connecting to solver!');
        }
    };
    
    const handleAnimate = (solutionData, method) => {
        if (isAnimating || followUpAnimation) return;
        const solutionMoves = (solutionData.full_solution || solutionData.solution).split(' ').filter(Boolean);
        if (isSolved) {
            setStatus("Returning to initial scrambled state...");
            setVisualCubies(getInitialVisualState);
            setFollowUpAnimation({ moves: solutionMoves, method });
            setAnimationQueue(scrambleSequence);
        } else {
            setStatus(`Animating ${method === 'kociemba' ? 'Machine' : 'Human-Style'} solution...`);
            setAnimationStats({ solution: solutionMoves.join(' '), currentMoveIndex: 1, solveTime: 0 });
            solveStartTime.current = performance.now();
            setAnimationQueue(solutionMoves);
        }
        setIsSolved(false);
    };

    const handleReset = () => {
        if (isAnimating) return;
        setAnimationQueue([]);
        setFollowUpAnimation(null);
        setVisualCubies(getInitialVisualState());
        setScrambleSequence([]);
        setStatus('Ready');
        setIsSolved(true);
        setResults({ kociemba: null, human: null });
        setAnimationStats({ solution: null, currentMoveIndex: 0, solveTime: 0 });
    };

    return (
<<<<<<< HEAD
        <main className="w-screen h-screen bg-[#2171b5] text-slate-800 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden">
=======
        <main className="w-screen h-screen bg-gradient-to-br from-sky-100 to-blue-200 text-slate-800 flex flex-col items-center justify-center p-4 lg:p-6 overflow-hidden">
>>>>>>> 1c80218d0c0cf9e755ed50c61f2613d32c2a61bc
             <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb {
<<<<<<< HEAD
                    background-color: rgba(100, 116, 139, 0.5);
=======
                    background-color: rgba(30, 64, 175, 0.3);
>>>>>>> 1c80218d0c0cf9e755ed50c61f2613d32c2a61bc
                    border-radius: 10px;
                    border: 2px solid transparent;
                    background-clip: content-box;
                }
<<<<<<< HEAD
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(100, 116, 139, 0.8); }
=======
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(30, 64, 175, 0.5); }
>>>>>>> 1c80218d0c0cf9e755ed50c61f2613d32c2a61bc
            `}</style>
            <div className="w-full h-full max-w-screen-2xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                <div className="flex flex-col gap-6 overflow-y-auto h-full custom-scrollbar pr-2">
                    <ActionPanel onSolve={handleSolve} onScramble={handleScramble} onReset={handleReset} isAnimating={isAnimating} scrambleLength={scrambleLength} setScrambleLength={setScrambleLength} />
                    <div className={`transition-all duration-500 ease-in-out grid gap-6 ${hasResults ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                        <SolutionComparison results={results} onAnimate={handleAnimate} isAnimating={isAnimating} />
                        {animationStats.solution && <SolutionSteps {...animationStats} />}
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-4 h-full min-h-[50vh] lg:min-h-0">
<<<<<<< HEAD
                    <div className="w-full h-full bg-slate-800/50 backdrop-blur-md rounded-xl p-2 shadow-2xl shadow-black/30 border border-white/10">
=======
                    <div className="w-full h-full bg-black/5 rounded-xl p-2 shadow-inner">
>>>>>>> 1c80218d0c0cf9e755ed50c61f2613d32c2a61bc
                        <Canvas camera={{ position: [5, 5, 5], fov: 35 }}>
                            <ambientLight intensity={1.2} />
                            <directionalLight position={[10, 10, 5]} intensity={0.8} />
                            <Suspense fallback={null}>
                                <AnimatedCube visualCubies={visualCubies} setVisualCubies={setVisualCubies} animationQueue={animationQueue} onAnimationComplete={handleAnimationComplete} />
                            </Suspense>
                            <OrbitControls />
                        </Canvas>
                    </div>
                     <StatusBar status={status} />
                </div>

            </div>
        </main>
    );
}

export default App;
