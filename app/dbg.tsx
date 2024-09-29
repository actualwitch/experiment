import { atom, WritableAtom } from "jotai";
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
          onChange={(e) => setC1(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c2}
          onChange={(e) => setC2(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input
          type="range"
          value={c3}
          onChange={(e) => setC3(parseFloat(e.target.value))}
          min={0}
          max={1}
          step={0.01}
        />
      </div>
      <div>
        <input type="range" value={a} onChange={(e) => setA(parseFloat(e.target.value))} min={0} max={1} step={0.01} />
      </div>
    </>
  );
}

export function tracingAtom(originalAtom: WritableAtom<any, any, void>) {
  const thisAtom = atom(
    (get) => {
      const value = get(originalAtom);
      console.log("get", value);
      return value;
    },
    (get, set, update) => {
      console.log("set", update);
      set(originalAtom, update);
    },
  );
  return thisAtom;
}
