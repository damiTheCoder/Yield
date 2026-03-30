import React from "react";
import TestRenderer, { act } from "react-test-renderer";
import { AppStateProvider, useApp } from "../src/lib/app-state";

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

TestRenderer.create(
  <AppStateProvider>
    <Control onReady={(ctx) => (controlRef.current = ctx)} />
  </AppStateProvider>
);

// Wait for effect to run
await act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

if (!controlRef.current) {
  throw new Error("Control not ready");
}

console.log("Initial state ready");

await act(async () => {
  const success = controlRef.current!.claimHuntToken("alpha", 20);
  console.log("Claim result:", success);
});

// Wait for state update
await act(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

const alphaAssets = controlRef.current.userAssets["alpha"];
console.log("Alpha assets after claim:", alphaAssets);
