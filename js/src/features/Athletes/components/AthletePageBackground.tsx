import { HERO_IMG_SRC } from "../../../shared/config/config";

export default function AthletePageBackground() {
  return (
    <>
      <div className="athlete-page-bg" style={{ backgroundImage: `url(${HERO_IMG_SRC})` }} />
      <div className="athlete-page-overlay" />
    </>
  );
}
