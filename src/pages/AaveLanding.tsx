import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronRight, Github, Twitter, Layers, Zap, Globe, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AaveLanding() {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#0D0E12] text-white font-sans selection:bg-[#2EBAC6] selection:text-black overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#2EBAC6]/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#B6509E]/10 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow delay-1000" />
            </div>

            {/* Navigation */}
            <nav
                className={cn(
                    "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
                    scrolled ? "bg-[#0D0E12]/80 backdrop-blur-md border-white/10 py-4" : "bg-transparent py-6"
                )}
            >
                <div className="container mx-auto px-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2EBAC6] to-[#B6509E] flex items-center justify-center">
                            <span className="font-bold text-white text-lg">S</span>
                        </div>
                        <span className="text-xl font-bold tracking-tight">Solaris</span>
                    </div>

                    <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
                        <a href="#" className="hover:text-white transition-colors">Protocol</a>
                        <a href="#" className="hover:text-white transition-colors">Governance</a>
                        <a href="#" className="hover:text-white transition-colors">Developers</a>
                        <a href="#" className="hover:text-white transition-colors">Community</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden sm:flex text-gray-300 hover:text-white hover:bg-white/5"
                            onClick={() => navigate("/legacy-home")}
                        >
                            Legacy View
                        </Button>
                        <Button
                            className="bg-[#2EBAC6] hover:bg-[#2EBAC6]/90 text-black font-semibold rounded-full px-6"
                            onClick={() => navigate("/assets")}
                        >
                            Launch App
                        </Button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 pt-32 pb-20 md:pt-48 md:pb-32 container mx-auto px-6">
                <div className="max-w-4xl">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1] mb-8">
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                            Liquidity Funded
                        </span>
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#2EBAC6] to-[#B6509E]">
                            Tokens are here.
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mb-12 leading-relaxed">
                        Solaris is a decentralized non-custodial liquidity protocol where users can participate as depositors or borrowers.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                            className="h-14 px-8 rounded-full bg-white text-black hover:bg-gray-200 text-lg font-semibold transition-transform hover:scale-105"
                            onClick={() => navigate("/assets")}
                        >
                            Launch App <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 px-8 rounded-full border-white/20 text-white hover:bg-white/10 text-lg font-medium backdrop-blur-sm"
                        >
                            Read the docs
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 border-t border-white/10 pt-12">
                    <div>
                        <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Market Size</div>
                        <div className="text-3xl md:text-4xl font-bold text-white">$18.4B</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Value Locked</div>
                        <div className="text-3xl md:text-4xl font-bold text-[#2EBAC6]">$12.8B</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Total Markets</div>
                        <div className="text-3xl md:text-4xl font-bold text-white">14</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Active Users</div>
                        <div className="text-3xl md:text-4xl font-bold text-[#B6509E]">142K</div>
                    </div>
                </div>
            </section>

            {/* Feature Cards */}
            <section className="relative z-10 py-20 container mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#2EBAC6]/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-[#2EBAC6]/20 flex items-center justify-center mb-6 text-[#2EBAC6]">
                            <Layers className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Supply & Earn</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Supply your assets to the protocol and earn interest. Your assets are used to provide liquidity to the market.
                        </p>
                        <div className="flex items-center text-[#2EBAC6] font-medium group-hover:gap-2 transition-all">
                            Learn more <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-[#B6509E]/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-[#B6509E]/20 flex items-center justify-center mb-6 text-[#B6509E]">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Borrow Assets</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Borrow against your collateral across multiple networks and assets. Instant liquidity without selling.
                        </p>
                        <div className="flex items-center text-[#B6509E] font-medium group-hover:gap-2 transition-all">
                            Learn more <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>

                    <div className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/50 transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm">
                        <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 text-white">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Safety First</h3>
                        <p className="text-gray-400 leading-relaxed mb-6">
                            Audited by top security firms and governed by the community. Your funds are secured by industry-leading protocols.
                        </p>
                        <div className="flex items-center text-white font-medium group-hover:gap-2 transition-all">
                            Learn more <ChevronRight className="w-4 h-4 ml-1" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Ecosystem Section */}
            <section className="relative z-10 py-20 container mx-auto px-6 border-t border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div className="max-w-xl">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">Governed by the community</h2>
                        <p className="text-gray-400 text-lg mb-8">
                            Solaris is fully decentralized and owned by the token holders. Participate in governance, vote on proposals, and shape the future of the protocol.
                        </p>
                        <Button variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
                            Go to Governance
                        </Button>
                    </div>
                    <div className="relative w-full max-w-md aspect-square">
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#2EBAC6] to-[#B6509E] rounded-full opacity-20 blur-3xl animate-pulse-slow" />
                        <div className="relative z-10 grid grid-cols-2 gap-4">
                            <div className="bg-[#0D0E12] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center aspect-square">
                                <Globe className="w-10 h-10 text-gray-400 mb-3" />
                                <span className="font-bold text-xl">DAO</span>
                            </div>
                            <div className="bg-[#0D0E12] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center aspect-square mt-8">
                                <div className="text-3xl font-bold text-[#2EBAC6]">120+</div>
                                <span className="text-gray-400 text-sm mt-1">Proposals</span>
                            </div>
                            <div className="bg-[#0D0E12] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center aspect-square -mt-8">
                                <div className="text-3xl font-bold text-[#B6509E]">50K+</div>
                                <span className="text-gray-400 text-sm mt-1">Voters</span>
                            </div>
                            <div className="bg-[#0D0E12] border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center aspect-square">
                                <Twitter className="w-10 h-10 text-gray-400 mb-3" />
                                <span className="font-bold text-xl">Social</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 border-t border-white/10 bg-[#0D0E12]">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#2EBAC6] to-[#B6509E]" />
                        <span className="font-bold text-lg">Solaris</span>
                    </div>
                    <div className="flex items-center gap-6 text-gray-400 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Docs</a>
                        <a href="#" className="hover:text-white transition-colors">FAQ</a>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                            <Twitter className="w-5 h-5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white hover:bg-white/10">
                            <Github className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
