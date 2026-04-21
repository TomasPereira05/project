import Header from "../../../shared/components/Header";
import { Hero } from "./Hero";
import { NewsGrid } from "../NewsGrid";
import { StandingsTable } from "../StandingTable";
import { Footer } from "./Footer";

export default function Home() {
  return (
    <div>
      <Header />
      <main>
        <Hero />
        <NewsGrid />
        <StandingsTable />
      </main>
      <Footer />
    </div>
  );
}
