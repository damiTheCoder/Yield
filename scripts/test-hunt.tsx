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

const Capture = ({ onReady }: { onReady: (api: ReturnType<typeof useApp>) => void }) => {
  const ctx = useApp();
  React.useEffect(() => {
    onReady(ctx);
  }, [ctx, onReady]);
  return null;
};

const result = await new Promise<any>((resolve) => {
  let api: ReturnType<typeof useApp> | null = null;
  const handleReady = (ctx: ReturnType<typeof useApp>) => {
    api = ctx;
  };

  TestRenderer.create(
    <AppStateProvider>
      <Capture onReady={handleReady} />
    </AppStateProvider>
  );

  const wait = () =>
    new Promise((r) => {
      setTimeout(r, 0);
    });

  (async () => {
    await wait();
    if (!api) throw new Error("ctx not ready");
    act(() => {
      api!.claimHuntToken("alpha", 20);
    });
    await wait();
    resolve(api!.userAssets["alpha"]);
  })();
});

console.log(result);
