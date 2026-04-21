import Header from "../../../shared/components/Header";
import {
  Hero,
  NewsGrid,
  StandingsTable,
  Footer
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
