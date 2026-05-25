import { useLocation } from "react-router-dom";
import { HERO_IMG_SRC } from "../../../shared/config/config";

export default function AthletePageBackground() {
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <div className="athlete-page-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})` }} />
      <div className="athlete-page-overlay" />
    </>
  );
}
