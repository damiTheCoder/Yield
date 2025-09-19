import Header from "@/components/Header";
import Hero from "@/components/Hero";
import TrendingSection from "@/components/TrendingSection";
import Categories from "@/components/Categories";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <Hero />
      <TrendingSection />
      <Categories />
    </div>
  );
};

export default Index;
