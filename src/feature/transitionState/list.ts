import {, type CSSProperties, useState, useCallback, useEffect, useMemo } from "react";
import type { Key, TransitionState } from ".";

type MoveContext = {
  index: number;
  style?: CSSProperties;
};
export function useListTransition<T extends { key: Key }>(
  list: Array<T>,
  { enterDelay, exitDelay } = { enterDelay: 50, exitDelay: 200 },
): (T & MoveContext & { state: TransitionState })[] {
  const [ids, setIds] = useState<Key[]>([]);
  const [entries, setEntries] = useState<Record<Key, T>>({});
  const [states, setStates] = useState<Record<Key, TransitionState>>({});
  const [moveContext, setMoveContext] = useState<Record<Key, MoveContext>>({});
  const enqueueUpdate = useCallback(
    (type: TransitionState, items: Key[]) => {
      if (items.length === 0) return;
      const delays: Partial<Record<TransitionState, number>> = {
        entering: enterDelay,
        exiting: exitDelay,
      };
      setTimeout(() => {
        if (type === "entering" || type === "entered") {
          setStates((states) => ({
            ...states,
            ...Object.fromEntries(items.map((id) => [id, type])),
          }));
          if (type === "entering") enqueueUpdate("entered", items);
        }
        if (type === "exiting") {
          setIds((ids) => ids.filter((id) => !items.includes(id)));
          setStates((states) => Object.fromEntries(Object.entries(states).filter(([id]) => !items.includes(id))));
          setEntries((entries) => Object.fromEntries(Object.entries(entries).filter(([id]) => !items.includes(id))));
        }
        if (type === "moving") {
          setMoveContext((moveContext) =>
            Object.fromEntries(
              Object.entries(moveContext).map(
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                ([key, { style, ...value }]) => [key, value],
              ),
            ),
          );
        }
      }, delays[type] || 0);
    },
    [setStates, setEntries],
  );
  useEffect(() => {
    const newIds: Key[] = [];
    const addedIds: Key[] = [];
    const removedIds: Key[] = [];
    const newEntries: Record<Key, T> = {};
    const newStates = { ...states };
    for (let index = 0; index < list.length; index += 1) {
      const item = list[index];
      if (!item) continue;
      newEntries[item.key] = item;
      newIds.push(item.key);
      if (newStates[item.key] === undefined) {
        addedIds.push(item.key);
      }
    }
    const resultingList = [...newIds];
    for (const id of ids) {
      if (!newEntries[id]) {
        const item = entries[id];
        if (!item) continue;
        newEntries[id] = item;
        const idx = ids.indexOf(id);
        resultingList.splice(idx, 0, id);
        removedIds.push(id);
        newStates[id] = "exiting";
      }
    }
    const newMoveContext: Record<Key, MoveContext> = {};
    const movedIds: Key[] = [];
    for (let index = 0; index < resultingList.length; index += 1) {
      const item = resultingList[index];
      if (!item) continue;
      const originalContext = moveContext[item];
      if (originalContext) {
        newMoveContext[item] = {
          ...originalContext,
          index,
        };
        if (originalContext.index !== index) {
          const s: CSSProperties = {};
          s.transform = s.WebkitTransform = `translateY(${originalContext.index < index ? "-" : ""}50%)`;
          s.transitionDuration = "0s";
          const itemContext = newMoveContext[item];
          if (!itemContext) continue;
          itemContext.style = s;
          movedIds.push(item);
        }
      } else {
        newMoveContext[item] = {
          index,
        } as MoveContext;
      }
    }
    setIds(resultingList);
    setEntries(newEntries);
    setStates(newStates);
    setMoveContext(newMoveContext);
    enqueueUpdate("entering", addedIds);
    enqueueUpdate("exiting", removedIds);
    enqueueUpdate("moving", movedIds);
  }, [list]);
  return useMemo(
    () =>
      ids.map((id) => ({
        ...entries[id]!,
        ...moveContext[id]!,
        state: states[id] || "exited",
      })),
    [ids, entries, states, moveContext],
  );
}
