import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useApp } from "@/lib/app-state";
import { preloadGoogleAuth } from "@/lib/google-auth";

function GoogleMark({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
    </svg>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { authUser, signInWithGoogle } = useApp();
  const [showGoogleAuth, setShowGoogleAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  useEffect(() => {
    preloadGoogleAuth();
  }, []);

  const handleLaunch = () => {
    if (authUser) {
      navigate("/assets");
      return;
    }
    setShowGoogleAuth(true);
  };

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthError("");
      await signInWithGoogle();
      navigate("/assets");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  const TopAuthButtonContent = () => {
    if (authLoading) {
      return <>Connecting...</>;
    }

    if (authUser) {
      return (
        <>
          <img src={authUser.avatar} alt={authUser.name} className="h-7 w-7 rounded-full object-cover" />
          <span>Launch App</span>
        </>
      );
    }
    if (showGoogleAuth) {
      return (
        <>
          <GoogleMark />
          <span>Signup / Signin</span>
        </>
      );
    }
    return <>Launch App</>;
  };

  const PrimaryAuthButtonContent = () => {
    if (authLoading) {
      return <>Connecting...</>;
    }

    if (showGoogleAuth && !authUser) {
      return (
        <>
          <GoogleMark />
          <span>Signup / Signin</span>
        </>
      );
    }

    return <>Launch App</>;
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/landing.png')" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/20 to-black/80" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/55 to-transparent" aria-hidden="true" />

      <section className="page-content-enter relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col px-7 pb-9 pt-8 sm:max-w-lg sm:px-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-left"
            aria-label="Solaris home"
          >
            <img src="/h4.png" alt="" className="h-9 w-9 rounded-full object-cover" />
            <span className="text-xl font-black tracking-[-0.04em]">Solaris</span>
          </button>
          <Button
            type="button"
            onClick={showGoogleAuth && !authUser ? handleGoogleSignIn : handleLaunch}
            disabled={authLoading}
            className="h-10 rounded-2xl border-0 bg-white/14 px-4 text-sm font-semibold text-white backdrop-blur-md hover:bg-white/20"
          >
            <TopAuthButtonContent />
          </Button>
        </div>

        <div className="mt-auto space-y-6 text-center">
          <div className="space-y-3">
            <h1 className="text-[3rem] font-black leading-[0.92] tracking-[-0.075em] text-white sm:text-[4.25rem]">
              Non-extractive Tokens,
              <span className="block">Real Liquidity.</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-base font-semibold text-white/92">
              <span>Built and powered by</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 backdrop-blur-md">
                <span className="h-3 w-3 rounded-full bg-[#0052FF]" />
                <span className="font-black tracking-[-0.04em]">base</span>
              </span>
            </div>
            <p className="mx-auto max-w-sm text-lg font-semibold leading-snug tracking-[-0.035em] text-white/78">
              Trade liquidity-backed assets with guaranteed floors, transparent cycles, and creator-aligned rewards.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              onClick={showGoogleAuth && !authUser ? handleGoogleSignIn : handleLaunch}
              disabled={authLoading}
              className="h-14 w-full rounded-2xl border-0 bg-[#1795FF] text-base font-bold text-white shadow-none hover:bg-[#0D83EA]"
            >
              <PrimaryAuthButtonContent />
            </Button>
            {authError ? <p className="text-sm font-semibold text-white/82">{authError}</p> : null}
            <Button
              type="button"
              onClick={() => navigate("/blog/liquidity-funded-tokens")}
              className="h-14 w-full rounded-2xl border-0 bg-black/72 text-base font-bold text-white shadow-none backdrop-blur-md hover:bg-black/82"
            >
              Learn more
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
