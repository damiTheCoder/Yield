import Header from "@/components/Header";
import BlockchainSelector from "@/components/BlockchainSelector";
import DropsSection from "@/components/DropsSection";
import Hero from "@/components/Hero";
import TrendingSection from "@/components/TrendingSection";
import Categories from "@/components/Categories";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <BlockchainSelector />
      <DropsSection />
      <Hero />
      <TrendingSection />
      <Categories />
    </div>
  );
};

export default Index;
