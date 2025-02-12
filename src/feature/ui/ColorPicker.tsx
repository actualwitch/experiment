import { useState } from "react";

export function ColorPicker() {
  const [c1, setC1] = useState(0.372);
  const [c2, setC2] = useState(0.903);
  const [c3, setC3] = useState(0.775);
  const [a, setA] = useState(1.0);
  const color = `color(display-p3 ${c1} ${c2} ${c3} / ${a})`;
  return (
    <>
      <div>
        <button type="submit" style={{ backgroundColor: color }}>
          system
        </button>
      </div>
      <div>
        <input
          type="range"
          value={c1}
          onChange={(e) => setC1(Number.parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c2}
          onChange={(e) => setC2(Number.parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c3}
          onChange={(e) => setC3(Number.parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={a}
          onChange={(e) => setA(Number.parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
    </>
  );
}