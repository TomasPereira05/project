import Header from "../../../shared/components/Header";
import Footer from "../../../shared/components/Footer";
import {
  Hero,
  NewsGrid,
  StandingsTable,
} from ".."

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
