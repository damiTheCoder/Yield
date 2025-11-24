import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { AppStateProvider, useApp } from "../src/lib/app-state";
import Portfolio from "../src/pages/Portfolio";

const noopStorage = {
  getItem: () => null,
  setItem: () => { },
  removeItem: () => { },
  clear: () => { },
  key: () => null,
  length: 0,
} as Storage;

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, 'localStorage', { value: noopStorage });
}

const Control = ({ onReady }: { onReady: (ctx: ReturnType<typeof useApp>) => void }) => {
  const ctx = useApp();
  React.useEffect(() => {
    onReady(ctx);
  }, [ctx, onReady]);
  return null;
};

const controlRef: { current: ReturnType<typeof useApp> | null } = { current: null };

const renderer = TestRenderer.create(
  <AppStateProvider>
    <Control onReady={(ctx) => (controlRef.current = ctx)} />
    <Portfolio />
  </AppStateProvider>
);

const printOwnedState = () => {
  const tree = renderer.toJSON();
  const text = JSON.stringify(tree);
  const hasAlpha = text.includes("Alpha Ecosystem");
  console.log("Contains Alpha:", hasAlpha);
};

printOwnedState();

// Wait for effect to run
await act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

if (!controlRef.current) {
  throw new Error("Control not ready");
}

await act(async () => {
  controlRef.current!.claimHuntToken("alpha", 20);
});

printOwnedState();
